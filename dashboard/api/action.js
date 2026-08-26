const qs = require('querystring');

function send(res,status,data){
  res.statusCode=status;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.setHeader('cache-control','no-store');
  res.end(JSON.stringify(data));
}
async function body(req){
  if(req.body && typeof req.body==='object') return req.body;
  let s=''; for await(const chunk of req) s+=chunk;
  try{return s?JSON.parse(s):{}}catch{return{}}
}
function configured(){
  return {
    twilio:{configured:!!(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_FROM_NUMBER)},
    openai:{configured:!!process.env.OPENAI_API_KEY},
    bluebubbles:{configured:!!(process.env.BLUEBUBBLES_URL&&process.env.BLUEBUBBLES_PASSWORD)}
  };
}
function heuristicPlan(prompt=''){
  const p=prompt.trim();
  const steps=[];
  if(/lead|referral|property|funeral|restoration|attorney|hotel|senior|outreach/i.test(p)){
    steps.push({title:'Choose the target list',detail:'Work the highest-priority referral sources first and verify the actual decision maker before outreach.'});
    steps.push({title:'Make the first touch',detail:'Call first, then send a concise email with Peak Bio Clean positioned as a 24/7 backup specialty resource.'});
    steps.push({title:'Track the relationship',detail:'Move every contact through the referral pipeline and schedule the next follow-up before ending the session.'});
  }
  if(/job|intake|scene|biohazard|cleanup|decomp|trauma/i.test(p)){
    steps.push({title:'Open an incident intake',detail:'Confirm authorization, access, incident type, scene-release status, hazards and urgency before dispatch.'});
    steps.push({title:'Create the job file',detail:'Convert the intake in Job Operations, complete assessment/authorization, scope, estimate, photos and required customer paperwork.'});
    steps.push({title:'Close the job completely',detail:'Finish remediation logs, waste records, verification, completion signoff, invoice/claim packet, payment status and archive.'});
  }
  if(!steps.length){
    steps.push({title:'Define the outcome',detail:'Write the exact result you need today and the person or system responsible for the next action.'});
    steps.push({title:'Execute inside the dashboard',detail:'Use Intake, Pipeline, Outreach, Documents or Job Operations so the action is recorded in the operating system.'});
    steps.push({title:'Set the next checkpoint',detail:'Before stopping, record the next follow-up or completion checkpoint.'});
  }
  return {summary:p?`Action plan for: ${p}`:'Peak Bio Clean action plan',steps};
}
async function openAiPlan(prompt,context){
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-5-mini',input:`You are the operations planner for Peak Bio Clean, a Florida biohazard remediation company. Return concise JSON with keys summary and steps; steps is an array of {title,detail}. User request: ${prompt}\nContext: ${JSON.stringify(context||{}).slice(0,12000)}`})});
  if(!r.ok) throw Error(`OpenAI planner returned ${r.status}`);
  const d=await r.json();
  const txt=(d.output_text||'').trim();
  try{return JSON.parse(txt)}catch{return heuristicPlan(prompt)}
}
async function twilioSms(to,message){
  const sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_FROM_NUMBER;
  if(!(sid&&token&&from)) throw Error('Twilio is not configured in this Vercel project.');
  const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{authorization:'Basic '+Buffer.from(`${sid}:${token}`).toString('base64'),'content-type':'application/x-www-form-urlencoded'},body:qs.stringify({To:to,From:from,Body:message})});
  const d=await r.json(); if(!r.ok) throw Error(d.message||'Twilio send failed'); return d;
}
async function createImage(prompt){
  if(!process.env.OPENAI_API_KEY) throw Error('OpenAI Images is not configured in this Vercel project.');
  const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1',prompt,size:'1024x1024'})});
  const d=await r.json(); if(!r.ok) throw Error(d.error?.message||'Image generation failed');
  const item=d.data?.[0]||{}; return {dataUrl:item.b64_json?`data:image/png;base64,${item.b64_json}`:item.url||null};
}
module.exports=async function handler(req,res){
  const action=(req.query&&req.query.action)||new URL(req.url,'https://local').searchParams.get('action')||'health';
  try{
    if(action==='health') return send(res,200,{integrations:configured()});
    if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
    const b=await body(req);
    if(action==='plan'){
      if(process.env.OPENAI_API_KEY){try{return send(res,200,await openAiPlan(String(b.prompt||''),b.context))}catch{}}
      return send(res,200,heuristicPlan(String(b.prompt||'')));
    }
    if(action==='sms'){
      if(!b.to||!b.body) return send(res,400,{error:'Phone number and message are required'});
      const d=await twilioSms(String(b.to),String(b.body)); return send(res,200,{success:true,message:'SMS sent',sid:d.sid});
    }
    if(action==='image'){
      if(!b.prompt) return send(res,400,{error:'Creative brief is required'});
      return send(res,200,{success:true,...await createImage(String(b.prompt))});
    }
    return send(res,400,{error:'Unknown action'});
  }catch(e){return send(res,400,{error:e&&e.message?e.message:'Request failed'});}
}
