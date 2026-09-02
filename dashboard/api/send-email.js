// Sends email as info@peakbioclean.com through Google (Gmail SMTP with an App Password),
// then records the outreach in peak_lead_touches so it shows on the lead timeline.
// Required Vercel env vars: GMAIL_USER (info@peakbioclean.com), GMAIL_APP_PASSWORD (16-char app password).
const nodemailer = require('nodemailer');

const SB = 'https://zzjcimwqttlqrcjiuffm.supabase.co';
const SB_KEY = 'sb_publishable_kexH74ejNOb7IM-Lzikouw_22xRKSR7';

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) throw Error('Missing Peak BioClean Cloud authorization');

    let p = req.body;
    if (!p || typeof p !== 'object') {
      let raw = ''; for await (const c of req) raw += c; p = raw ? JSON.parse(raw) : {};
    }

    const to = (p.to || '').trim();
    const subject = (p.subject || '').trim();
    const message = (p.message || '').toString();
    if (!to) throw Error('No recipient email address');
    if (!subject) throw Error('Subject is required');
    if (!message) throw Error('Message is required');

    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw Error('Google email is not connected yet. Add GMAIL_USER and GMAIL_APP_PASSWORD in Vercel.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    // Plain-text message -> simple HTML (preserve line breaks, keep the packet link clickable)
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = esc(message)
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
      .replace(/\n/g, '<br>');

    const info = await transporter.sendMail({
      from: `Peak Bio-Clean <${GMAIL_USER}>`,
      to,
      subject,
      text: message,
      html
    });

    // Log the outreach so it appears on the lead timeline (best-effort).
    let logged = false;
    if (p.leadId && p.userId) {
      try {
        const row = {
          lead_id: p.leadId,
          user_id: p.userId,
          channel: 'email',
          status: 'Sent',
          result: 'Sent via Gmail',
          subject,
          message,
          contacted_at: new Date().toISOString(),
          follow_up_at: p.followUpAt || null
        };
        const lr = await fetch(SB + '/rest/v1/peak_lead_touches', {
          method: 'POST',
          headers: { apikey: SB_KEY, authorization: auth, 'content-type': 'application/json', prefer: 'return=minimal' },
          body: JSON.stringify(row)
        });
        logged = lr.ok;
      } catch (_) { /* logging is best-effort */ }
    }

    res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, id: info.messageId, logged }));
  } catch (e) {
    res.statusCode = 400; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Email send failed' }));
  }
};
