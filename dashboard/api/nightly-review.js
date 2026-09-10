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

// Vercel runs this in UTC, but the business runs in Florida. Every date decision
// here is made in Eastern time or the report lands on the wrong day.
const etFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
});
function etDay(d) { return etFormat.format(new Date(d)); }

// The job fires early morning Eastern, so the day worth reporting on is the one
// that just ended. Anchored at noon UTC so DST can't shift it across a boundary.
function previousEtDay() {
  const d = new Date(etDay(new Date()) + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

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

    const reportDay = previousEtDay();
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const dashboardRes = await fetch(`${proto}://${req.headers.host}/api/dashboard-data`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'load' })
    });
    const dashboardData = dashboardRes.ok ? await dashboardRes.json() : { leads: [], touches: [] };
    const leads = dashboardData.leads || [];
    const touches = dashboardData.touches || [];

    // Fetch a window wide enough to cover the Eastern day, then narrow it in Eastern time.
    let posts = [];
    try {
      const windowStart = new Date(new Date(reportDay + 'T12:00:00Z').getTime() - 36 * 3600 * 1000).toISOString();
      const recent = await sbGet(`content_log?select=*&posted_at=gte.${encodeURIComponent(windowStart)}`);
      posts = recent.filter(p => etDay(p.posted_at) === reportDay);
    } catch (_) { /* table may not exist yet */ }

    const shipped = [];
    const dayTouches = touches.filter(t => etDay(t.contacted_at) === reportDay);
    if (dayTouches.length) shipped.push(`${dayTouches.length} outreach touch${dayTouches.length === 1 ? '' : 'es'} logged`);
    if (posts.length) shipped.push(`${posts.length} content post${posts.length === 1 ? '' : 's'} published`);
    const wonThatDay = leads.filter(l => l.outreach_status === 'Partner' && l.updated_at && etDay(l.updated_at) === reportDay);
    if (wonThatDay.length) shipped.push(`${wonThatDay.length} lead${wonThatDay.length === 1 ? '' : 's'} moved to Partner`);

    const slipped = [];
    const overdue = leads.filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at) < new Date() && !['Partner', 'Not Interested'].includes(l.outreach_status));
    if (overdue.length) slipped.push(`${overdue.length} follow-up${overdue.length === 1 ? '' : 's'} still overdue: ${overdue.slice(0, 5).map(l => l.company).join(', ')}${overdue.length > 5 ? '…' : ''}`);
    if (!posts.length) slipped.push('Nothing posted');
    if (!dayTouches.length) slipped.push('No outreach logged');

    const summary = shipped.length && !slipped.length
      ? 'Clean day. Everything that needed to move, moved.'
      : (!shipped.length && slipped.length ? 'Quiet day. Nothing shipped, follow-ups are piling up.' : 'Mixed day. Some things shipped, some slipped.');

    // Upsert one row per day.
    await fetch(`${SB}/rest/v1/daily_review_log?on_conflict=review_date`, {
      method: 'POST',
      headers: { apikey: SB_KEY, 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ review_date: reportDay, summary, shipped, slipped, sent_at: new Date().toISOString() })
    });

    // Email the report if Gmail is configured; skip quietly if not (dashboard still shows it).
    let emailed = false;
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') }
      });
      const to = process.env.REVIEW_EMAIL_TO || process.env.GMAIL_USER;
      const pretty = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric'
      }).format(new Date(reportDay + 'T12:00:00Z'));
      const lines = [
        `Peak Bio-Clean — how ${pretty} went`,
        '',
        summary,
        '',
        'SHIPPED:',
        ...(shipped.length ? shipped.map(s => `  - ${s}`) : ['  (nothing)']),
        '',
        'SLIPPED:',
        ...(slipped.length ? slipped.map(s => `  - ${s}`) : ['  (nothing)']),
        '',
        'Open the Morning Briefing tab to work today\'s list.'
      ];
      await transporter.sendMail({
        from: `Peak Bio-Clean <${process.env.GMAIL_USER}>`,
        to, subject: `${pretty}: ${summary}`,
        text: lines.join('\n')
      });
      emailed = true;
    }

    res.statusCode = 200; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, review_date: reportDay, shipped, slipped, emailed }));
  } catch (e) {
    res.statusCode = 500; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Nightly review failed' }));
  }
};
