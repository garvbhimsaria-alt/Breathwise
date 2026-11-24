import fetch from 'node-fetch';
const url = 'https://api.openaq.org/v3/locations?coordinates=28.6139,77.2090&radius=25000&limit=5';
(async () => {
  try {
    const resp = await fetch(url, {headers:{'Accept':'application/json'}});
    const json = await resp.json();
    const ids = (json.results||[]).map(r=>r.id);
    console.log('IDs:', ids.join(','));
  } catch(e){ console.error('err',e.message); }
})();
