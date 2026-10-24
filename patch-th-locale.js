// Re-apply Thai locale patch to Devin Desktop webapp.
// Usage: node patch-th-locale.js [assetsDir]
// Run again after every Devin update (updates rewrite the app bundle).
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = __dirname;
const CHUNK = 'th-ThaiLang1.js';

// --- locate assets dir ---
const REL = 'out/vs/workbench/devin-webapp-host/assets';
const candidates = [
  process.argv[2],
  process.env.DEVIN_ASSETS,
  path.join(process.env.LOCALAPPDATA || '', 'Programs/Devin/resources/app', REL),
  '/Applications/Devin.app/Contents/Resources/app/' + REL,
  path.join(os.homedir(), 'Applications/Devin.app/Contents/Resources/app', REL),
].filter(Boolean);
const ASSETS = candidates.find(d => fs.existsSync(d) && fs.readdirSync(d).some(f => f.startsWith('entry-host-editor-mode-menu-')));
if (!ASSETS) { console.error('assets dir not found — pass it as: node patch-th-locale.js <assetsDir>'); process.exit(1); }
console.log('assets:', ASSETS);

// --- 1. merge + validate thai dicts ---
const merged = {};
for (const f of ['th-a1.json', 'th-a2.json', 'th-a3.json', 'th-b.json', 'th-c.json']) {
  const d = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf-8'));
  for (const ns in d) {
    if (merged[ns]) { console.error('DUP ns:', ns); process.exit(1); }
    merged[ns] = d[ns];
  }
}
const en = JSON.parse(fs.readFileSync(path.join(SRC, 'en-dict.json'), 'utf-8'));
const flat = (o, p, out) => { for (const k in o) { const v = o[k]; const kk = p ? p + '.' + k : k; if (typeof v === 'string') out[kk] = v; else flat(v, kk, out); } return out; };
const enF = flat(en, '', {}), thF = flat(merged, '', {});
let bad = 0;
for (const k in thF) {
  const enV = enF[k];
  if (!enV) { console.error('KEY-NOT-IN-EN:', k); bad++; continue; }
  const a = (enV.match(/\{\{[^}]+\}\}|<[^/>]+\/>|<[^>]+>/g) || []).sort().join();
  const b = (thF[k].match(/\{\{[^}]+\}\}|<[^/>]+\/>|<[^>]+>/g) || []).sort().join();
  if (a !== b) { console.error('PH-MISMATCH:', k); bad++; }
}
if (bad) { console.error('validation failed:', bad); process.exit(1); }
console.log('namespaces:', Object.keys(merged).length, '| th keys:', Object.keys(thF).length);

// --- 2. write chunk ---
fs.writeFileSync(path.join(ASSETS, CHUNK), 'export default ' + JSON.stringify(merged) + ';\n');
console.log('chunk written:', CHUNK);

// --- 3. patch locale registry ---
const entry = fs.readdirSync(ASSETS).find(f => f.startsWith('entry-host-editor-mode-menu-'));
const fp = path.join(ASSETS, entry);
let s = fs.readFileSync(fp, 'utf-8');
if (s.includes('code:`th`')) { console.log('registry already patched'); }
else {
  const anchor = '{code:`en`,label:`English`}';
  const insert = anchor + ',{code:`th`,label:`ไทย`,translation:()=>import(`./' + CHUNK + '`).then(e=>e.default)}';
  if (!s.includes(anchor)) { console.error('registry anchor not found — Devin build changed, needs re-analysis'); process.exit(1); }
  if (!fs.existsSync(fp + '.bak')) fs.copyFileSync(fp, fp + '.bak');
  fs.writeFileSync(fp, s.replace(anchor, insert));
  console.log('patched:', entry, '(backup: ' + entry + '.bak)');
}
console.log('DONE — quit Devin fully, reopen, then Settings → Language → ไทย');
