export async function onRequestPost({ request }) {
  try {
    const { accountId, token } = await request.json();
    if (!accountId || !token) return json({ success:false, error:'Account ID dan API Token wajib diisi.' },400);
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects?per_page=1`, { headers:{ Authorization:`Bearer ${token}` } });
    const d = await r.json();
    if (!r.ok || !d.success) return json({ success:false, error:cfError(d) },r.status || 400);
    return json({ success:true, message:'✓ Cloudflare terhubung. Token memiliki akses ke Pages.' });
  } catch(e) { return json({ success:false, error:e.message },500); }
}
function cfError(d){return d?.errors?.map(x=>x.message).join('; ')||'Cloudflare API menolak request.'}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
