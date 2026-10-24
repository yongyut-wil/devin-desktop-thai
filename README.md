# devin-desktop-thai

เพิ่มตัวเลือกภาษา **ไทย** ใน Settings → Language ของ [Devin Desktop](https://devin.ai) —
patch ระดับ local สำหรับ i18n registry ของ webapp (i18next)

> Unofficial community patch — ไม่เกี่ยวข้องกับ Cognition/Devin อย่างเป็นทางการ
> ใช้กับ installation บนเครื่องตัวเองเท่านั้น และต้อง re-apply หลังทุก app update

## ครอบคลุม

- **100 namespaces / ~2,926 keys** — surface ที่ใช้บ่อยสุด:
  sidebar, session menus/tabs/status, message composer (input/inputBox),
  command palette, settings hub, inbox, notifications, model picker, auth/login
- key ที่ไม่ได้แปล → fallback เป็น **English อัตโนมัติ** (ไม่พัง)
- ที่ยังเป็นอังกฤษโดยตั้งใจ: settings ลึก (~3k keys), worklog, transcript,
  onboarding, admin/enterprise pages, review UI

## วิธีใช้

ต้องมี Node.js (เวอร์ชันใดก็ได้ ไม่มี dependency)

```bash
git clone https://github.com/yongyut-wil/devin-desktop-thai.git
cd devin-desktop-thai
node patch-th-locale.js
```

แล้ว **quit Devin ให้สุด (รวม system tray / menu bar) → เปิดใหม่ →
Settings → Language → ไทย**

### Path ที่รองรับอัตโนมัติ

| OS | Path |
|---|---|
| Windows | `%LOCALAPPDATA%\Programs\Devin\resources\app\out\vs\workbench\devin-webapp-host\assets` |
| macOS | `/Applications/Devin.app/Contents/Resources/app/out/vs/workbench/devin-webapp-host/assets` |
| macOS (user install) | `~/Applications/Devin.app/Contents/Resources/app/...` |

ติดตั้งที่อื่น → ส่ง path เอง:

```bash
node patch-th-locale.js "/path/to/.../devin-webapp-host/assets"
# หรือ
DEVIN_ASSETS=/path/to/assets node patch-th-locale.js
```

## หลัง Devin update

Update จะเขียนทับ `resources/app` ทั้งโฟลเดอร์ → patch หาย
**รันคำสั่งเดิมซ้ำได้เลย** — script เป็น idempotent:

- dict validate ใหม่ทุกครั้ง (placeholder `{{var}}` / `<tag/>` ต้องตรงต้นฉบับ)
- เขียน `th-ThaiLang1.js` chunk ใหม่
- patch registry เฉพาะตอนที่ยังไม่มี `th`
- backup ไฟล์เดิมเป็น `*.js.bak` อัตโนมัติ

ถ้า script ขึ้น `registry anchor not found` แปลว่า Devin build ใหม่เปลี่ยน
โครงสร้าง bundle — เปิด issue หรือรอ update ของ repo นี้

## ทำงานยังไง

Devin webapp ใช้ i18next + lazy locale chunks กอง registry ภาษาอยู่ใน
`entry-host-editor-mode-menu-*.js` (minified `gu` array) script จะ:

1. merge `th-*.json` → เขียน `th-ThaiLang1.js` เป็น locale chunk
   (flat `{namespace: dict}` — shape เดียวกับ `ja-*.js` ของ Devin)
2. insert `{code:'th', label:'ไทย', translation:()=>import('./th-ThaiLang1.js')}`
   หลัง English entry ใน registry
3. patch `windsurf-chat-client/index.js` (agents/chat panel — webview แยกที่มี
   i18next ของตัวเองและ hardcode `lng:"en"`) โดย inject dict ไทยเข้า
   `resources` แล้วเปลี่ยนเป็น `lng:"th"`

ภาษาที่เลือก persist ใน `localStorage["devin-language"]` — เลือกครั้งเดียวใช้ตลอด

## ไฟล์

| ไฟล์ | คือ |
|---|---|
| `patch-th-locale.js` | installer/patcher (Node, zero-dep) |
| `th-a1..a3, th-b, th-c.json` | คำแปลไทยแยกตามกลุ่ม namespace |
| `en-dict.json` | ต้นฉบับอังกฤษ (ใช้ validate เท่านั้น) |

## เสริม: ให้ agent ตอบภาษาไทย

แยกจาก UI patch — ใส่ใน `~/.devin/global_rules.md`:

```md
- ตอบกลับและสื่อสารเป็นภาษาไทยเสมอ แม้ผู้ใช้จะพิมพ์เป็นภาษาอังกฤษ
  เว้นแต่ผู้ใช้สั่งให้ใช้ภาษาอื่นโดยชัดเจน
- คงชื่อฟังก์ชัน ตัวแปร คำสั่ง path และศัพท์เทคนิคเป็นภาษาอังกฤษ
```

## Contribute

อยากแปลเพิ่ม → แก้/เพิ่ม key ใน `th-*.json` (shape = `{namespace: {nested: {key: "คำแปล"}}}`)
แล้ว `node patch-th-locale.js` จะ validate + rebuild ให้เอง

## English summary

Adds a **Thai (ไทย)** option to Devin Desktop's Settings → Language by patching
the app's internal i18next locale registry and injecting a Thai translation chunk
(~2,900 keys covering the main session UI). English fallback for untranslated keys.
Run `node patch-th-locale.js`, restart Devin, pick ไทย. Re-run after every app update.
Requires Node.js. Local-only modification — no warranty, use at your own risk.

## License

MIT
