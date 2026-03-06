/**
 * Data export — all decrypted local data as JSON or PDF.
 * The server NEVER sees this. Everything runs client-side.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// Lazy-required — react-native-html-to-pdf is a native module that
// crashes Expo Go at register time. Import only when actually calling exportAsPDF.
// In a dev/prod native build this resolves correctly.
let _RNHTMLtoPDF: typeof import('react-native-html-to-pdf').default | null = null;
function getRNHTMLtoPDF() {
  if (!_RNHTMLtoPDF) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _RNHTMLtoPDF = require('react-native-html-to-pdf').default;
  }
  return _RNHTMLtoPDF!;
}
import { listSessions } from './local';
import { decrypt } from '../crypto/aes-gcm';
import { moodColor } from '../theme/colors';
import type { Block } from '../models/block';

interface ExportSession {
  id: string;
  moodScore: number;
  createdAt: string;
  blocks: Block[];
  tags: string[];
}

// ─── Decrypt all sessions ─────────────────────────────────────────────────────

async function decryptAll(masterKey: CryptoKey): Promise<ExportSession[]> {
  const rows = await listSessions();
  const results: ExportSession[] = [];

  for (const row of rows) {
    const plain = await decrypt(
      { ciphertext: row.ciphertext, iv: row.iv, version: row.schema_ver },
      masterKey
    );
    if (!plain) continue;
    const data = JSON.parse(plain);
    results.push({
      id: row.id,
      moodScore: row.mood_score,
      createdAt: row.created_at,
      blocks: data.blocks ?? [],
      tags: data.tags ?? [],
    });
  }

  return results;
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export async function exportAsJSON(masterKey: CryptoKey): Promise<void> {
  const sessions = await decryptAll(masterKey);
  const json = JSON.stringify({ exportedAt: new Date().toISOString(), sessions }, null, 2);

  const path = `${FileSystem.documentDirectory}therapy-binder-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json' });
  }
}

// ─── PDF Transition Report ────────────────────────────────────────────────────

function moodLabel(score: number): string {
  if (score >= 8) return 'Thriving';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Neutral';
  return 'Struggling';
}

function buildHTML(sessions: ExportSession[]): string {
  const rows = sessions
    .map((s) => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const insightBlock = s.blocks.find((b) => b.type === 'insight');
      const insight =
        insightBlock && 'content' in insightBlock ? insightBlock.content : '';
      const textBlocks = s.blocks
        .filter((b) => b.type === 'text' && 'content' in b)
        .map((b) => ('content' in b ? b.content : ''))
        .join('<br><br>');
      const actionBlocks = s.blocks
        .filter((b) => b.type === 'action')
        .map((b) => `<li${('completed' in b && b.completed) ? ' style="text-decoration:line-through;opacity:0.6"' : ''}>${'content' in b ? b.content : ''}</li>`)
        .join('');
      const color = moodColor(s.moodScore);
      const tags = s.tags.map((t) => `<span style="background:${color}20;color:${color};padding:2px 8px;border-radius:10px;font-size:11px;margin-right:4px">#${t}</span>`).join('');

      return `
        <div style="page-break-inside:avoid;margin-bottom:32px;border-left:4px solid ${color};padding-left:16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:#8B6A5A">${date}</span>
            <span style="background:${color};color:white;padding:2px 10px;border-radius:10px;font-size:11px">
              ${s.moodScore}/10 · ${moodLabel(s.moodScore)}
            </span>
          </div>
          ${insight ? `<p style="font-family:serif;font-size:18px;color:#5C4033;margin:8px 0;font-style:italic">"${insight}"</p>` : ''}
          ${textBlocks ? `<p style="font-size:13px;color:#5C4033;line-height:1.6;margin:8px 0">${textBlocks}</p>` : ''}
          ${actionBlocks ? `<ul style="font-size:13px;color:#5C4033;margin:8px 0">${actionBlocks}</ul>` : ''}
          ${tags ? `<div style="margin-top:8px">${tags}</div>` : ''}
        </div>`;
    })
    .join('');

  const avgMood =
    sessions.length > 0
      ? (sessions.reduce((a, s) => a + s.moodScore, 0) / sessions.length).toFixed(1)
      : '—';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, sans-serif; color: #5C4033; background: #FAF6F0; margin: 40px; }
        h1 { font-family: Georgia, serif; font-size: 28px; color: #5C4033; }
        h2 { font-family: Georgia, serif; font-size: 16px; color: #8B6A5A; font-weight: normal; margin-top: 0; }
        .summary { background: white; border-radius: 12px; padding: 16px; margin: 24px 0; display: flex; gap: 24px; }
        .stat { text-align: center; }
        .stat-num { font-size: 28px; font-family: Georgia, serif; color: #5C4033; }
        .stat-label { font-size: 11px; color: #8B6A5A; letter-spacing: 1px; text-transform: uppercase; }
        .notice { background: #7DAF8F20; border-radius: 8px; padding: 10px 16px; font-size: 11px; color: #7DAF8F; margin-bottom: 32px; }
      </style>
    </head>
    <body>
      <h1>Therapy Binder</h1>
      <h2>Transition Report — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</h2>

      <div class="notice">🔒 This report was generated entirely on your device. It was never sent to any server.</div>

      <div class="summary">
        <div class="stat">
          <div class="stat-num">${sessions.length}</div>
          <div class="stat-label">Sessions</div>
        </div>
        <div class="stat">
          <div class="stat-num">${avgMood}</div>
          <div class="stat-label">Avg Mood</div>
        </div>
        <div class="stat">
          <div class="stat-num">${sessions.filter(s => s.moodScore >= 6).length}</div>
          <div class="stat-label">Good Days</div>
        </div>
      </div>

      <div>${rows}</div>
    </body>
    </html>`;
}

export async function exportAsPDF(masterKey: CryptoKey): Promise<void> {
  const sessions = await decryptAll(masterKey);
  const html = buildHTML(sessions);

  const result = await getRNHTMLtoPDF().convert({
    html,
    fileName: `therapy-binder-transition-${Date.now()}`,
    base64: false,
  });

  if (result.filePath && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(result.filePath, { mimeType: 'application/pdf' });
  }
}
