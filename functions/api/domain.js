export async function onRequestPost({ request }) {
  try {
    const { accountId, token, projectName, domain } = await request.json();
    if (!accountId || !token || !projectName || !domain) return json({success:false,error:'Account ID, token, project, dan domain wajib diisi.'},400);
    const base=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/domains`;
    const r=await fetch(base,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({name:String(domain).trim().toLowerCase()})});
    const d=await r.json();
    if(!r.ok||!d.success)return json({success:false,error:cfError(d),details:d.errors||[]},r.status||400);
    return json({success:true,domain:d.result});
  }catch(e){return json({success:false,error:e.message},500)}
}
function cfError(d){return d?.errors?.map(x=>x.message).join('; ')||'Cloudflare API menolak request.'}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
