// Nightly Review Agent — runs on Vercel Cron (see vercel.json).
// Checks what shipped today (touches logged, posts published) vs what slipped
// (follow-ups that stayed overdue), writes the result to daily_review_log, and
// emails a short report so the day's activity is impossible to miss.
//
// Reuses GMAIL_USER / GMAIL_APP_PASSWORD already configured for send-email.js.
// Optional: REVIEW_EMAIL_TO (defaults to GMAIL_USER, i.e. emails yourself).
const nodemailer = require('nodemailer');

const SB = 'https://zzjcimwqttlqrcjiuffm.supabase.co';
const SB_KEY = 'sb_publishable_kexH74ejNOb7IM-Lzikouw_22xRKSR7';

async function sbGet(path) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: SB_KEY, 'content-type': 'application/json' } });
  if (!r.ok) throw Error(`Supabase read failed: ${path}`);
  return r.json();
}

function localDay(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }

module.exports = async function handler(req, res) {
  try {
    // Cron requests carry no auth by default on Vercel; allow manual triggers too, but
    // require a shared secret if REVIEW_CRON_SECRET is set, to stop random public calls.
    if (process.env.REVIEW_CRON_SECRET) {
      const auth = req.headers.authorization || '';
      if (auth !== `Bearer ${process.env.REVIEW_CRON_SECRET}`) {
        res.statusCode = 401; res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
    }

    const today = localDay(new Date());
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const dashboardRes = await fetch(`${proto}://${req.headers.host}/api/dashboard-data`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'load' })
    });
    const dashboardData = dashboardRes.ok ? await dashboardRes.json() : { leads: [], touches: [] };
    const leads = dashboardData.leads || [];
    const touches = dashboardData.touches || [];

    let posts = [];
    try { posts = await sbGet(`content_log?select=*&posted_at=gte.${encodeURIComponent(today + 'T00:00:00Z')}`); } catch (_) { /* table may not exist yet */ }

    const shipped = [];
    const todaysTouches = touches.filter(t => localDay(t.contacted_at) === today);
    if (todaysTouches.length) shipped.push(`${todaysTouches.length} outreach touch${todaysTouches.length === 1 ? '' : 'es'} logged`);
    if (posts.length) shipped.push(`${posts.length} content post${posts.length === 1 ? '' : 's'} published`);
    const wonToday = leads.filter(l => l.outreach_status === 'Partner' && localDay(l.updated_at) === today);
    if (wonToday.length) shipped.push(`${wonToday.length} lead${wonToday.length === 1 ? '' : 's'} moved to Partner`);

    const slipped = [];
    const overdue = leads.filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at) < new Date() && !['Partner', 'Not Interested'].includes(l.outreach_status));
    if (overdue.length) slipped.push(`${overdue.length} follow-up${overdue.length === 1 ? '' : 's'} still overdue: ${overdue.slice(0, 5).map(l => l.company).join(', ')}${overdue.length > 5 ? '…' : ''}`);
    if (!posts.length) slipped.push('No content posted today');
    if (!todaysTouches.length) slipped.push('No outreach logged today');

    const summary = shipped.length && !slipped.length
      ? 'Clean day — everything that needed to move, moved.'
      : (!shipped.length && slipped.length ? 'Quiet day — nothing shipped, follow-ups are piling up.' : 'Mixed day — some things shipped, some slipped.');

    // Upsert one row per day.
    await fetch(`${SB}/rest/v1/daily_review_log?on_conflict=review_date`, {
      method: 'POST',
      headers: { apikey: SB_KEY, 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ review_date: today, summary, shipped, slipped, sent_at: new Date().toISOString() })
    });

    // Email the report if Gmail is configured; skip quietly if not (dashboard still shows it).
    let emailed = false;
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') }
      });
      const to = process.env.REVIEW_EMAIL_TO || process.env.GMAIL_USER;
      const lines = [
        `Peak Bio-Clean — Nightly Review — ${today}`,
        '',
        summary,
        '',
        'SHIPPED:',
        ...(shipped.length ? shipped.map(s => `  • ${s}`) : ['  (nothing)']),
        '',
        'SLIPPED:',
        ...(slipped.length ? slipped.map(s => `  • ${s}`) : ['  (nothing)'])
      ];
      await transporter.sendMail({
        from: `Peak Bio-Clean <${process.env.GMAIL_USER}>`,
        to, subject: `Nightly Review — ${today} — ${summary}`,
        text: lines.join('\n')
      });
      emailed = true;
    }

    res.statusCode = 200; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, review_date: today, shipped, slipped, emailed }));
  } catch (e) {
    res.statusCode = 500; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Nightly review failed' }));
  }
};
