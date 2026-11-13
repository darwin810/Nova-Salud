$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$node = (Get-Command node.exe).Source
$localNode = Join-Path $PSScriptRoot '.local/runtime/node_modules/node/bin/node.exe'
if (Test-Path $localNode) { $node = $localNode }
$mongo = Get-Item .local/mongod.exe -ErrorAction SilentlyContinue
if (!$mongo) { throw 'Falta el ejecutable local de MongoDB.' }
$data = New-Item -ItemType Directory -Force .local/data
function Test-LocalPort([int]$Port) {
    $socket = [Net.Sockets.TcpClient]::new()
    try { $socket.Connect('127.0.0.1', $Port); return $true }
    catch { return $false }
    finally { $socket.Dispose() }
}
if (!(Test-LocalPort 27173)) {
    $process = Start-Process $mongo.FullName -ArgumentList '--replSet botica --bind_ip 127.0.0.1 --port 27173 --dbpath ".local/data" --logpath ".local/mongo.log" --logappend --wiredTigerCacheSizeGB 0.25' -WindowStyle Hidden -PassThru
    for ($i = 0; $i -lt 60 -and !(Test-LocalPort 27173); $i++) {
        if ($process.HasExited) { throw 'MongoDB se detuvo. Revisa .local/mongo.log.' }
        Start-Sleep -Seconds 1
    }
}
@"
import { MongoClient } from 'mongodb';
const port = '127.0.0.1:27173';
const c = await MongoClient.connect('mongodb://'+port+'/?directConnection=true');
try {
  const admin = c.db('admin');
  try { await admin.command({ replSetGetStatus: 1 }); }
  catch (e) {
    if (e.code !== 94) throw e;
    await admin.command({ replSetInitiate: { _id: 'botica', members: [{ _id: 0, host: port }] } });
  }
} finally { await c.close(); }
"@ | & $node --input-type=module
if ($LASTEXITCODE) { throw 'No se pudo preparar la réplica.' }
& $node --env-file=.env.local scripts/migrate.js
if ($LASTEXITCODE) { throw 'Falló la inicialización de la base.' }
& $node node_modules/vite/bin/vite.js
