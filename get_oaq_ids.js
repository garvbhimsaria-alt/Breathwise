(async () => {
  const url = 'https://api.openaq.org/v3/locations?coordinates=28.6139,77.2090&radius=25000&limit=5';
  const resp = await fetch(url, {headers:{'Accept':'application/json'}});
  const data = await resp.json();
  const ids = (data.results||[]).map(r=>r.id);
  console.log('ids:', ids.join(','));
})();
