$base = 'https://api.openaq.org/v3/locations?coordinates=28.6139,77.2090&radius=25000&limit=5'
$resp = Invoke-RestMethod -Uri $base -Headers @{Accept='application/json'}
$ids = $resp.results | Select-Object -ExpandProperty id
Write-Output ($ids -join ',')
