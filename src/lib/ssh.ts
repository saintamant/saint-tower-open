import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const SSH_HOST = process.env.SSH_HOST || 'localhost';
const SSH_USER = process.env.SSH_USER || 'user';
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || '~/.ssh/id_rsa';

function resolveKeyPath(keyPath: string): string {
  if (keyPath.startsWith('~')) {
    return path.join(process.env.HOME || process.env.USERPROFILE || '', keyPath.slice(1));
  }
  return keyPath;
}

export async function sshExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        stream.on('close', (code: number) => {
          conn.end();
          if (code !== 0 && stderr) {
            reject(new Error(`SSH command failed (code ${code}): ${stderr}`));
          } else {
            resolve(stdout.trim());
          }
        });
        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });

    conn.on('error', (err) => {
      reject(new Error(`SSH connection error: ${err.message}`));
    });

    const keyPath = resolveKeyPath(SSH_KEY_PATH);
    const connectConfig: Record<string, unknown> = {
      host: SSH_HOST,
      port: 22,
      username: SSH_USER,
    };

    try {
      if (fs.existsSync(keyPath)) {
        connectConfig.privateKey = fs.readFileSync(keyPath);
      }
    } catch {
      // Fall back to agent auth
    }

    conn.connect(connectConfig as Parameters<Client['connect']>[0]);
  });
}
