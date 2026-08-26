module.exports = async function handler(req,res){
  if(req.method==='OPTIONS'){res.statusCode=204;return res.end()}
  if(req.method!=='POST'){res.statusCode=405;res.setHeader('content-type','application/json');return res.end(JSON.stringify({error:'Method not allowed'}))}
  try{
    const auth=req.headers.authorization||'';
    if(!auth.startsWith('Bearer ')) throw Error('Missing Peak BioClean Cloud authorization');
    let payload=req.body;
    if(!payload||typeof payload!=='object'){
      let raw=''; for await(const c of req) raw+=c; payload=raw?JSON.parse(raw):{};
    }
    const r=await fetch('https://zzjcimwqttlqrcjiuffm.supabase.co/functions/v1/highlevel',{method:'POST',headers:{apikey:'sb_publishable_kexH74ejNOb7IM-Lzikouw_22xRKSR7',authorization:auth,'content-type':'application/json'},body:JSON.stringify(payload)});
    const text=await r.text();
    res.statusCode=r.status;res.setHeader('content-type',r.headers.get('content-type')||'application/json');res.setHeader('cache-control','no-store');res.end(text);
  }catch(e){res.statusCode=400;res.setHeader('content-type','application/json');res.end(JSON.stringify({error:e?.message||'HighLevel proxy failed'}))}
}
