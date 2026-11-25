import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(name, cwd, args) {
  const proc = spawn('npm', args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  proc.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return proc;
}

const api = run('backend', resolve(root, 'backend'), ['run', 'dev']);
const web = run('frontend', resolve(root, 'frontend'), ['run', 'dev']);

const shutdown = () => {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
