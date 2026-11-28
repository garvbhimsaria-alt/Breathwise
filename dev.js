import net from 'node:net';
import { spawn } from 'node:child_process';
import process from 'node:process';

const port = Number(process.env.BW_SERVER_PORT || 5000);
const host = '127.0.0.1';
const env = { ...process.env, PORT: String(port), BW_SERVER_PORT: String(port) };

function isBackendListening() {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.setTimeout(700);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

let backend;
let vite;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (backend && !backend.killed) backend.kill();
  if (vite && !vite.killed) vite.kill();
  process.exitCode = code;
}

if (await isBackendListening()) {
  console.log(`BreatheWise backend already responds at http://${host}:${port}; reusing it.`);
} else {
  backend = spawn(process.execPath, ['--watch', 'server/index.js'], { stdio: 'inherit', env });
  backend.on('error', error => console.error('Backend could not start:', error.message));
  backend.on('exit', code => {
    if (!stopping && code) console.error(`Backend stopped with exit code ${code}. Vite will stay open; check the backend message above.`);
  });
}

vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env });
vite.on('error', error => { console.error('Vite could not start:', error.message); stop(1); });
vite.on('exit', code => stop(code || 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));