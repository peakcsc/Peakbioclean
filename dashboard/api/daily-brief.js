// Daily Brief — the email that tells Parker exactly what to do today.
// Runs twice a day on Vercel Cron (see vercel.json):
//   11:00 UTC / 7am ET  — the full brief: yesterday's recap, today's plan, today's follow-ups
//   15:00 UTC / 11am ET — a short mid-day nudge: what's still open
//
// The 30-day startup plan lives in /startup-plan.json at the deployment root and is
// fetched over HTTP, so editing that file is all it takes to change what the email says.
//
// Env: GMAIL_USER + GMAIL_APP_PASSWORD (already set for send-email.js).
// Optional: REVIEW_EMAIL_TO (defaults to GMAIL_USER), REVIEW_CRON_SECRET.
const nodemailer = require('nodemailer');

const SB = 'https://zzjcimwqttlqrcjiuffm.supabase.co';
const SB_KEY = 'sb_publishable_kexH74ejNOb7IM-Lzikouw_22xRKSR7';
const BLUE = '#1965B1';

// Vercel runs in UTC, the business runs in Florida. Every date decision goes through ET.
const etFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
});
const etDay = d => etFormat.format(new Date(d));
const etHour = () => Number(new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour: 'numeric', hour12: false
}).format(new Date()));

function shiftDay(day, delta) {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function daysBetween(from, to) {
  return Math.round((new Date(to + 'T12:00:00Z') - new Date(from + 'T12:00:00Z')) / 864e5);
}
function prettyDate(day) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric'
  }).format(new Date(day + 'T12:00:00Z'));
}

async function sbGet(path) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: SB_KEY, 'content-type': 'application/json' } });
  if (!r.ok) throw Error(`Supabase read failed: ${path}`);
  return r.json();
}

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = async function handler(req, res) {
  try {
    if (process.env.REVIEW_CRON_SECRET) {
      const auth = req.headers.authorization || '';
      if (auth !== `Bearer ${process.env.REVIEW_CRON_SECRET}`) {
        res.statusCode = 401; res.setHeader('content-type', 'application/json');
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const forced = url.searchParams.get('slot');
    const test = url.searchParams.get('test') === '1';
    // Slot from the clock unless overridden, so it works whether or not cron carries a query string.
    const slot = forced || (etHour() < 10 ? 'morning' : 'midday');

    const today = etDay(new Date());
    const yesterday = shiftDay(today, -1);
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${proto}://${req.headers.host}`;

    const [dashboardData, plan] = await Promise.all([
      fetch(`${origin}/api/dashboard-data`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'load' })
      }).then(r => r.ok ? r.json() : { leads: [], touches: [] }).catch(() => ({ leads: [], touches: [] })),
      fetch(`${origin}/startup-plan.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const leads = dashboardData.leads || [];
    const touches = dashboardData.touches || [];

    // ---- today's plan ----
    let planDay = null, planNumber = null;
    if (plan) {
      planNumber = daysBetween(plan.startDate, today) + 1;
      if (planNumber >= 1 && planNumber <= (plan.days || []).length) {
        planDay = plan.days.find(d => d.day === planNumber) || null;
      } else if (planNumber > (plan.days || []).length && plan.ongoing) {
        const dow = new Date(today + 'T12:00:00Z').getUTCDay();
        planDay = plan.ongoing[String(dow)] || null;
      }
    }

    // Everything still open whose due day has arrived, today's tasks and anything
    // rolled forward from an earlier day. Mirrors the same logic in the dashboard.
    let openList = null;
    if (plan && planNumber >= 1) {
      let rows = null;
      try { rows = await sbGet('plan_progress?select=*&limit=500'); } catch (_) { rows = null; }
      if (rows !== null) {
        const byKey = new Map(rows.map(r => [`${r.plan_day}:${r.task_index}`, r]));
        openList = [];
        for (let d = 1; d <= Math.min(planNumber, plan.days.length); d++) {
          const entry = plan.days.find(x => x.day === d);
          if (!entry) continue;
          const natural = shiftDay(plan.startDate, d - 1);
          (entry.tasks || []).forEach((task, i) => {
            const row = byKey.get(`${d}:${i}`);
            if (row && row.status === 'done') return;
            const due = (row && row.due_day) || natural;
            if (due <= today) openList.push({ planDay: d, task, carried: natural < today });
          });
        }
      }
    }

    // ---- follow-ups ----
    const now = new Date();
    const actionable = l => !['Partner', 'Not Interested'].includes(l.outreach_status);
    const overdue = leads.filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at) < now && etDay(l.next_follow_up_at) !== today && actionable(l));
    const dueToday = leads.filter(l => l.next_follow_up_at && etDay(l.next_follow_up_at) === today && actionable(l));
    const neverContacted = leads.filter(l => (l.contact_attempts || 0) === 0 && actionable(l));

    // ---- yesterday's recap (morning slot only) ----
    const yTouches = touches.filter(t => etDay(t.contacted_at) === yesterday);

    // content_log only exists after the one-time Supabase setup. Until then we know
    // nothing about posting, which is not the same as knowing nothing was posted —
    // so stay silent on it rather than accusing him of skipping a day.
    let yPosts = [], contentTracking = false;
    try {
      const since = new Date(new Date(yesterday + 'T12:00:00Z').getTime() - 36 * 3600 * 1000).toISOString();
      const recent = await sbGet(`content_log?select=*&posted_at=gte.${encodeURIComponent(since)}`);
      yPosts = recent.filter(p => etDay(p.posted_at) === yesterday);
      contentTracking = true;
    } catch (_) { /* not set up yet */ }

    const shipped = [];
    if (yTouches.length) shipped.push(`${yTouches.length} outreach touch${yTouches.length === 1 ? '' : 'es'} logged`);
    if (yPosts.length) shipped.push(`${yPosts.length} post${yPosts.length === 1 ? '' : 's'} published`);
    const wonYesterday = leads.filter(l => l.outreach_status === 'Partner' && l.updated_at && etDay(l.updated_at) === yesterday);
    if (wonYesterday.length) shipped.push(`${wonYesterday.length} lead${wonYesterday.length === 1 ? '' : 's'} became a partner`);

    const slipped = [];
    if (overdue.length) slipped.push(`${overdue.length} follow-up${overdue.length === 1 ? '' : 's'} overdue`);
    if (contentTracking && !yPosts.length) slipped.push('Nothing posted yesterday');
    if (!yTouches.length) slipped.push('No outreach logged yesterday');

    // ---- compose ----
    const isMorning = slot === 'morning';
    const dayLabel = planNumber && planNumber >= 1
      ? (planNumber <= (plan?.days || []).length ? `Day ${planNumber} of 30` : 'Ongoing rhythm')
      : 'Getting started';

    const subject = isMorning
      ? `${dayLabel} — ${planDay ? planDay.focus : 'your day'}`
      : `Mid-day check: ${overdue.length + dueToday.length} follow-up${(overdue.length + dueToday.length) === 1 ? '' : 's'} still open`;

    const section = (title, inner) =>
      `<tr><td style="padding:22px 26px 0"><div style="font:600 11px/1.4 -apple-system,Segoe UI,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:${BLUE};margin-bottom:9px">${esc(title)}</div>${inner}</td></tr>`;

    const taskList = tasks => tasks.map(t => {
      const carried = t.carried;
      const task = t.task || t;
      return `<div style="margin:0 0 13px;padding-left:16px;border-left:2px solid ${carried ? '#E8B765' : '#E0E8F2'}">
         <div style="font:600 15px/1.45 -apple-system,Segoe UI,sans-serif;color:#1B2733">${esc(task.title)}${carried ? ` <span style="font:600 11px -apple-system,sans-serif;color:#9A6212;background:#FBF1DF;padding:2px 6px;border-radius:99px;white-space:nowrap">from Day ${t.planDay}</span>` : ''}</div>
         ${task.detail ? `<div style="font:400 14px/1.55 -apple-system,Segoe UI,sans-serif;color:#5A6675;margin-top:3px">${esc(task.detail)}</div>` : ''}
       </div>`;
    }).join('');

    const leadRows = list => list.slice(0, 8).map(l =>
      `<div style="font:400 14px/1.6 -apple-system,Segoe UI,sans-serif;color:#3B4654">
         <b style="color:#1B2733">${esc(l.company || 'Unnamed')}</b>${l.name ? ` — ${esc(l.name)}` : ''}${l.phone ? ` · ${esc(l.phone)}` : ''}
       </div>`).join('');

    // Prefer the tracked list (carries unfinished work forward); fall back to the
    // raw plan day when progress tracking isn't set up yet.
    const carriedCount = openList ? openList.filter(t => t.carried).length : 0;
    const todaysTasks = openList || (planDay?.tasks || []);
    const carriedNote = carriedCount
      ? `<div style="font:500 14px/1.5 -apple-system,Segoe UI,sans-serif;color:#9A6212;margin:0 0 12px">${carriedCount} task${carriedCount === 1 ? '' : 's'} carried over from an earlier day.</div>`
      : '';

    let body = '';
    if (isMorning) {
      if (todaysTasks.length) {
        body += section(planDay?.focus ? `Today · ${planDay.focus}` : 'Today', carriedNote + taskList(todaysTasks));
      } else if (openList) {
        body += section('Today', `<div style="font:400 15px/1.55 -apple-system,Segoe UI,sans-serif;color:#14724A">Everything on the plan is done. Spend the day on the follow-up queue.</div>`);
      }
      if (overdue.length || dueToday.length) {
        body += section(
          `Follow-ups · ${overdue.length} overdue, ${dueToday.length} due today`,
          leadRows([...overdue, ...dueToday]) +
          ((overdue.length + dueToday.length) > 8 ? `<div style="font:400 13px -apple-system,sans-serif;color:#6B7A8C;margin-top:6px">and ${overdue.length + dueToday.length - 8} more in the dashboard</div>` : '')
        );
      } else if (neverContacted.length) {
        body += section('No follow-ups scheduled', `<div style="font:400 14px/1.55 -apple-system,Segoe UI,sans-serif;color:#3B4654">${neverContacted.length} lead${neverContacted.length === 1 ? '' : 's'} have never been contacted. Start at the top of the queue.</div>`);
      }
      body += section('Yesterday',
        `<div style="font:400 14px/1.65 -apple-system,Segoe UI,sans-serif;color:#3B4654">
           <b style="color:#14724A">Shipped:</b> ${shipped.length ? esc(shipped.join(' · ')) : 'nothing logged'}<br>
           <b style="color:#9A6212">Slipped:</b> ${slipped.length ? esc(slipped.join(' · ')) : 'nothing'}
         </div>`);
    } else {
      const open = [...overdue, ...dueToday];
      body += section('Still open right now',
        open.length
          ? leadRows(open) + `<div style="font:400 13px -apple-system,sans-serif;color:#6B7A8C;margin-top:8px">Clear these before the day gets away from you.</div>`
          : `<div style="font:400 15px/1.55 -apple-system,Segoe UI,sans-serif;color:#14724A">Nothing overdue. If today's plan tasks are done too, you're clear.</div>`);
      if (todaysTasks.length) {
        body += section('Still on the plan today', taskList(todaysTasks.slice(0, 4)));
      }
    }

    const html = `<div style="background:#F4F7FB;padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E0E8F2;border-radius:14px;overflow:hidden">
<tr><td style="background:${BLUE};padding:20px 26px">
  <div style="font:700 19px/1.25 -apple-system,Segoe UI,sans-serif;color:#fff;letter-spacing:-.01em">Peak Bio-Clean</div>
  <div style="font:500 13px -apple-system,Segoe UI,sans-serif;color:#CFE2F6;margin-top:3px">${esc(isMorning ? prettyDate(today) : 'Mid-day check')} · ${esc(dayLabel)}</div>
</td></tr>
${body}
<tr><td style="padding:24px 26px 26px">
  <div style="height:1px;background:#E0E8F2;margin-bottom:16px"></div>
  <div style="font:400 13px/1.55 -apple-system,Segoe UI,sans-serif;color:#6B7A8C">
    Open the Morning Briefing tab to work the list. Log every call, and always set the next follow-up date before you close a lead.
    ${test ? '<br><br><b>This was a manual test send.</b>' : ''}
  </div>
</td></tr>
</table></div>`;

    const textLines = [`PEAK BIO-CLEAN — ${isMorning ? prettyDate(today) : 'Mid-day check'} — ${dayLabel}`, ''];
    if (todaysTasks.length) {
      textLines.push(`TODAY: ${planDay?.focus || ''}`);
      if (carriedCount) textLines.push(`(${carriedCount} carried over from an earlier day)`);
      todaysTasks.forEach(t => {
        const task = t.task || t;
        textLines.push(`  - ${task.title}${t.carried ? ` [from Day ${t.planDay}]` : ''}`);
        if (task.detail) textLines.push(`    ${task.detail}`);
      });
      textLines.push('');
    }
    if (overdue.length || dueToday.length) {
      textLines.push(`FOLLOW-UPS: ${overdue.length} overdue, ${dueToday.length} due today`);
      [...overdue, ...dueToday].slice(0, 8).forEach(l => textLines.push(`  - ${l.company || 'Unnamed'}${l.phone ? ' · ' + l.phone : ''}`));
      textLines.push('');
    }
    if (isMorning) {
      textLines.push(`YESTERDAY SHIPPED: ${shipped.length ? shipped.join(' · ') : 'nothing logged'}`);
      textLines.push(`YESTERDAY SLIPPED: ${slipped.length ? slipped.join(' · ') : 'nothing'}`);
    }

    // Store the morning run so the dashboard's Briefing tab can show it.
    if (isMorning && !test) {
      try {
        await fetch(`${SB}/rest/v1/daily_review_log?on_conflict=review_date`, {
          method: 'POST',
          headers: { apikey: SB_KEY, 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            review_date: yesterday,
            summary: planDay ? `${dayLabel}: ${planDay.focus}` : dayLabel,
            shipped, slipped, sent_at: new Date().toISOString()
          })
        });
      } catch (_) { /* table may not exist yet; email still goes out */ }
    }

    let emailed = false, mailError = null;
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com', port: 465, secure: true,
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') }
        });
        await transporter.sendMail({
          from: `Peak Bio-Clean <${process.env.GMAIL_USER}>`,
          to: process.env.REVIEW_EMAIL_TO || process.env.GMAIL_USER,
          subject: test ? `[TEST] ${subject}` : subject,
          text: textLines.join('\n'),
          html
        });
        emailed = true;
      } catch (e) { mailError = e?.message || 'send failed'; }
    } else {
      mailError = 'GMAIL_USER / GMAIL_APP_PASSWORD not set in Vercel';
    }

    res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({
      ok: true, slot, test, emailed, mailError,
      planDay: planNumber, focus: planDay?.focus || null,
      counts: { leads: leads.length, overdue: overdue.length, dueToday: dueToday.length, shipped: shipped.length, slipped: slipped.length }
    }));
  } catch (e) {
    res.statusCode = 500; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Daily brief failed' }));
  }
};
