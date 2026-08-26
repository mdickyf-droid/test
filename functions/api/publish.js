export async function onRequestPost({ request }) {
  try {
    const { accountId, token, projectName, html } = await request.json();
    if (!accountId || !token || !projectName || typeof html !== 'string') return json({success:false,error:'accountId, token, projectName, dan html wajib diisi.'},400);
    const name = String(projectName).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,63);
    if (!name) return json({success:false,error:'Nama project tidak valid.'},400);
    const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`;
    const headers = { Authorization:`Bearer ${token}` };
    let project = await fetch(`${base}/pages/projects/${encodeURIComponent(name)}`, {headers});
    if (!project.ok) {
      const create = await fetch(`${base}/pages/projects`, {method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({name,production_branch:'main'})});
      const cd = await create.json();
      if (!create.ok || !cd.success) return json({success:false,error:cfError(cd)},create.status||400);
    }
    const worker = `const HTML = ${JSON.stringify(html)};\nexport default { async fetch(){ return new Response(HTML,{headers:{\"content-type\":\"text/html; charset=UTF-8\",\"cache-control\":\"no-cache\"}}); } };`;
    const form = new FormData();
    form.append('_worker.js', new Blob([worker], {type:'application/javascript'}), '_worker.js');
    form.append('branch','main');
    form.append('commit_message','Publish from LP Publisher');
    const deploy = await fetch(`${base}/pages/projects/${encodeURIComponent(name)}/deployments`, {method:'POST',headers,body:form});
    const dd = await deploy.json();
    if (!deploy.ok || !dd.success) return json({success:false,error:cfError(dd)},deploy.status||400);
    const result = dd.result || {};
    return json({success:true,deploymentId:result.id,url:result.url || `https://${name}.pages.dev`});
  } catch(e){ return json({success:false,error:e.message},500); }
}
function cfError(d){return d?.errors?.map(x=>x.message).join('; ')||'Cloudflare API menolak request.'}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
