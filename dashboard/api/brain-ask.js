const SB_URL = 'https://zzjcimwqttlqrcjiuffm.supabase.co';
const SB_KEY = 'sb_publishable_kexH74ejNOb7IM-Lzikouw_22xRKSR7';

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ error: 'Method not allowed' })); }
  try {
    let payload = req.body;
    if (!payload || typeof payload !== 'object') {
      let raw = ''; for await (const c of req) raw += c; payload = raw ? JSON.parse(raw) : {};
    }
    const question = String(payload.question || '').trim();
    if (!question) throw Error('Missing question');

    const words = question.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 6);
    const orFilter = words.length
      ? words.map(w => `title.ilike.*${encodeURIComponent(w)}*,content.ilike.*${encodeURIComponent(w)}*`).join(',')
      : `content.ilike.*${encodeURIComponent(question)}*`;

    const r = await fetch(`${SB_URL}/rest/v1/brain_docs?select=id,title,category,content&or=(${orFilter})&limit=6`, {
      headers: { apikey: SB_KEY, 'content-type': 'application/json' }
    });
    if (!r.ok) throw Error('Search failed');
    const matches = await r.json();

    let answer = null;
    if (process.env.OPENAI_API_KEY && matches.length) {
      try {
        const context = matches.map(m => `# ${m.title} (${m.category})\n${m.content}`).join('\n\n---\n\n').slice(0, 6000);
        const ai = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: process.env.OPENAI_TEXT_MODEL || 'gpt-5-mini',
            messages: [
              { role: 'system', content: 'You are Peak Bio-Clean\'s internal company brain. Answer only from the provided docs. If the docs do not cover it, say so plainly and suggest they add a doc for it. Be brief.' },
              { role: 'user', content: `Docs:\n\n${context}\n\nQuestion: ${question}` }
            ],
            max_tokens: 400
          })
        });
        if (ai.ok) {
          const aiData = await ai.json();
          answer = aiData?.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (e) { /* fall back to raw matches, no hard failure */ }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ answer, matches }));
  } catch (e) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || 'Brain search failed' }));
  }
};
