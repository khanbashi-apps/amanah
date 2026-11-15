/* أمانة — Amanah v1.1 — تطبيق ويب لإدارة الديون والسلفيات (يعمل بدون إنترنت) */
'use strict';
const VERSION = 'v1.1';

/* ---------- أدوات ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r3 = n => Math.round((+n || 0) * 1000) / 1000;
const fmt = n => r3(n).toLocaleString('en-US', { maximumFractionDigits: 3 });
const normDigits = s => String(s ?? '')
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/٫/g, '.').replace(/[,،\s]/g, '');
const num = s => { const v = parseFloat(normDigits(s)); return isFinite(v) ? v : NaN; };
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = String(s || '').split('-').map(Number); return new Date(y || 1970, (m || 1) - 1, d || 1); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const dim = (y, m) => new Date(y, m + 1, 0).getDate();
const LOC = 'ar-OM-u-nu-latn';
const _f = {};
const fmtr = (k, o) => _f[k] || (_f[k] = new Intl.DateTimeFormat(LOC, o));
const fDate = d => fmtr('d', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
const fDM = d => fmtr('dm', { day: 'numeric', month: 'long' }).format(d);
const fMY = d => fmtr('my', { month: 'long', year: 'numeric' }).format(d);
const fMon = d => fmtr('m', { month: 'long' }).format(d);
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const rid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const MINUS = '\u2212';
const daysAr = n => n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`;
/* ---------- نسخة الآيفون (IPA عبر Capacitor) ---------- */
const isNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const nativeReady = new Promise(res => {
  if (!isNative) return res();
  const sc = document.createElement('script'); sc.src = 'capacitor.js';
  sc.onload = () => res(); sc.onerror = () => res(); document.head.appendChild(sc);
});
const NP = name => {
  if (!isNative) return null;
  const C = window.Capacitor, P = C.Plugins || {};
  if (P[name]) return P[name];
  try { const cx = window.capacitorExports; if (cx && cx.registerPlugin) return cx.registerPlugin(name); } catch (e) {}
  try { if (C.registerPlugin) return C.registerPlugin(name); } catch (e) {}
  return null;
};
const signed = (v, sign) => `<bdi dir="ltr">${sign}${fmt(v)}</bdi>`;

/* ---------- ألوان البطاقات ---------- */
const COLORS = [
  { id: 'teal', bg: '#1F6F78', ink: '#FFFFFF', sub: '#CFE6E8', name: 'أزرق مخضر' },
  { id: 'plum', bg: '#6B3E75', ink: '#FFFFFF', sub: '#E6D3EA', name: 'بنفسجي' },
  { id: 'ochre', bg: '#8A5E17', ink: '#FFFFFF', sub: '#F4E3C4', name: 'ذهبي داكن' },
  { id: 'slate', bg: '#3E4C59', ink: '#FFFFFF', sub: '#D3DAE1', name: 'رمادي' },
  { id: 'blue', bg: '#2F55A4', ink: '#FFFFFF', sub: '#D6E0F5', name: 'أزرق' },
  { id: 'green', bg: '#2E6B47', ink: '#FFFFFF', sub: '#D2E8DA', name: 'أخضر' },
  { id: 'rose', bg: '#9C3D54', ink: '#FFFFFF', sub: '#F2D4DB', name: 'وردي داكن' },
  { id: 'white', bg: '#FFFFFF', ink: '#16181D', sub: '#5D6470', name: 'أبيض' },
];
const COL = id => COLORS.find(c => c.id === id) || COLORS[0];
const segColors = col => col.id === 'white'
  ? { on: '#16181D', part: '#8A9099', off: '#E3E5E9', due: '#E8892B' }
  : { on: '#FFFFFF', part: 'rgba(255,255,255,.6)', off: 'rgba(255,255,255,.25)', due: '#FFD9A8' };

/* ---------- قوالب الرسائل ---------- */
const TPL_IN = `السلام عليكم {الاسم}، عسى أن تكون بخير.
تذكير ودي بحساب السلفية بيننا:
🔹 إجمالي الدين الأصلي: {الإجمالي} ر.ع
🔹 المبلغ المتبقي حالياً: {المتبقي} ر.ع
🔹 قسط هذا الشهر: {القسط} ر.ع (تاريخ الاستحقاق: {الموعد})
شكراً لتعاونك وحرصك على حفظ الحقوق.`;
const TPL_OUT = `السلام عليكم {الاسم}، عسى أن تكون بخير.
هذا كشف بحساب السلفية التي عليّ لك:
🔹 إجمالي الدين الأصلي: {الإجمالي} ر.ع
🔹 ما تم سداده: {المسدد} ر.ع
🔹 المتبقي حالياً: {المتبقي} ر.ع
🔹 القسط القادم: {القسط} ر.ع (تاريخ الاستحقاق: {الموعد})
جزاك الله خيراً على صبرك وتعاونك.`;
const PLACEHOLDERS = ['{الاسم}', '{الإجمالي}', '{المسدد}', '{المتبقي}', '{القسط}', '{الموعد}'];

/* ---------- البيانات ---------- */
const KEY = 'amanah.data.v1';
const SHARE_KEYS = ['title', 'parties', 'date', 'remaining', 'progress', 'total', 'paid', 'monthly', 'due', 'updated', 'note'];
const DEF_SETTINGS = {
  myName: '', mode: 'auto', remindDays: 1, tplIn: TPL_IN, tplOut: TPL_OUT,
  pinHash: '', faceId: '', notify: true, notifyHour: 9,
  share: { brand: true, show: Object.fromEntries(SHARE_KEYS.map(k => [k, true])) },
};
const S = { debts: [], settings: structuredClone(DEF_SETTINGS) };
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (j) {
      S.debts = Array.isArray(j.debts) ? j.debts : [];
      const st = j.settings || {};
      S.settings = { ...structuredClone(DEF_SETTINGS), ...st,
        share: { brand: st.share?.brand ?? true, show: { ...DEF_SETTINGS.share.show, ...(st.share?.show || {}) } } };
    }
  } catch (e) { /* بيانات تالفة: نبدأ من جديد */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (!isNative) toast('تعذّر الحفظ: مساحة التخزين ممتلئة'); }
  nativeAfterSave();
}
/* في نسخة الآيفون نحفظ نسخة ثانية من البيانات في ملفات التطبيق حتى لا تضيع */
let mirrorT = 0;
function nativeAfterSave() {
  if (!isNative) return;
  clearTimeout(mirrorT);
  mirrorT = setTimeout(async () => {
    await nativeReady;
    const fs = NP('Filesystem');
    if (fs) { try { await fs.writeFile({ path: 'amanah-data.json', data: JSON.stringify(S), directory: 'DATA', encoding: 'utf8' }); } catch (e) {} }
    scheduleNotis();
  }, 600);
}
async function nativeRestore() {
  const fs = NP('Filesystem'); if (!fs || S.debts.length) return false;
  try {
    const r = await fs.readFile({ path: 'amanah-data.json', directory: 'DATA', encoding: 'utf8' });
    const j = JSON.parse(r.data);
    if (j && Array.isArray(j.debts) && j.debts.length) { try { localStorage.setItem(KEY, r.data); } catch (e) {} S.debts = j.debts; const st = j.settings || {};
      S.settings = { ...structuredClone(DEF_SETTINGS), ...st, share: { brand: st.share?.brand ?? true, show: { ...DEF_SETTINGS.share.show, ...(st.share?.show || {}) } } };
      return true; }
  } catch (e) {}
  return false;
}
const getDebt = id => S.debts.find(d => d.id === id);

/* ملفات المرفقات في IndexedDB */
let _idb = null;
function idb() {
  if (_idb) return _idb;
  _idb = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('amanah', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return _idb;
}
async function ftx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction('files', mode); const st = t.objectStore('files');
    let out; const rq = fn(st); if (rq) rq.onsuccess = () => { out = rq.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
async function fput(id, blob) {
  let ok = false;
  try { await ftx('readwrite', st => st.put(blob, id)); ok = true; } catch (e) {}
  if (isNative) {
    try { await nativeReady; const b64 = (await blobToDataURL(blob)).split(',')[1];
      await NP('Filesystem').writeFile({ path: 'att/' + id, data: b64, directory: 'DATA', recursive: true }); ok = true; } catch (e) {}
  }
  if (!ok) throw new Error('save failed');
}
async function fget(id) {
  let b;
  try { b = await ftx('readonly', st => st.get(id)); } catch (e) {}
  if (!b && isNative) {
    try { await nativeReady; const r = await NP('Filesystem').readFile({ path: 'att/' + id, directory: 'DATA' });
      b = new Blob([Uint8Array.from(atob(r.data), c => c.charCodeAt(0))]); } catch (e) {}
  }
  return b;
}
async function fdel(id) {
  try { await ftx('readwrite', st => st.delete(id)); } catch (e) {}
  if (isNative) { try { await NP('Filesystem').deleteFile({ path: 'att/' + id, directory: 'DATA' }); } catch (e) {} }
}
const urlCache = new Map();
async function fileURL(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  try { const b = await fget(id); if (!b) return ''; const u = URL.createObjectURL(b); urlCache.set(id, u); return u; }
  catch (e) { return ''; }
}

/* ---------- الحسابات ---------- */
function dueDate(d, k) {
  const s = pd(d.start); const mm = s.getMonth() + 1 + k;
  const y = s.getFullYear() + Math.floor(mm / 12); const mo = mm % 12;
  return new Date(y, mo, Math.min(+d.dueDay || s.getDate(), dim(y, mo)));
}
function calc(d) {
  const pays = d.payments || [];
  const paid = r3(pays.reduce((a, p) => a + (+p.amount || 0), 0));
  const total = +d.total || 0;
  const remaining = Math.max(0, r3(total - paid));
  const pct = total > 0 ? Math.min(100, paid / total * 100) : 0;
  const settled = total > 0 && remaining <= 0.0005;
  const t = today();
  const lastPay = pays.length ? pays.map(p => p.date).sort().slice(-1)[0] : null;
  const r = { paid, total, remaining, pct, settled, lastPay, m: +d.monthly || 0, dueNow: false };
  if (r.m > 0) {
    const m = r.m;
    const cycles = Math.max(1, Math.ceil(total / m - 1e-9));
    let elapsed = 0; while (elapsed < cycles && dueDate(d, elapsed) <= t) elapsed++;
    const behind = r3(Math.min(total, m * elapsed) - paid);
    const k0 = Math.min(cycles - 1, Math.floor(paid / m + 1e-9));
    Object.assign(r, { cycles, elapsed, k0, paidCycles: Math.min(cycles, Math.floor(paid / m + 1e-9)), endDate: dueDate(d, cycles - 1) });
    if (!settled) {
      r.nextDate = dueDate(d, k0);
      r.nextAmount = Math.min(remaining, r3(m * (k0 + 1) - paid));
      r.behind = behind > 0.0005 ? behind : 0;
      r.dueNow = r.behind > 0;
      r.overdueCount = r.dueNow ? Math.ceil(r.behind / m - 1e-9) : 0;
      r.payNow = Math.min(remaining, r.dueNow ? Math.min(m, r.behind) : r.nextAmount);
      r.daysToNext = daysBetween(t, r.nextDate);
      r.monthsLeft = Math.ceil(remaining / m - 1e-9);
    }
  }
  r.paidThisMonth = !settled && !r.dueNow && !!lastPay && lastPay.slice(0, 7) === iso(t).slice(0, 7);
  r.soon = !settled && !r.dueNow && r.m > 0 && r.daysToNext >= 0 && r.daysToNext <= (+S.settings.remindDays || 0);
  return r;
}
function planPreview(total, monthly, start, dueDay) {
  if (!(total > 0) || !(monthly > 0) || !start) return null;
  const d = { total, monthly, start, dueDay };
  const cycles = Math.ceil(total / monthly - 1e-9);
  return { cycles, first: dueDate(d, 0), end: dueDate(d, cycles - 1), last: r3(total - monthly * (cycles - 1)) };
}
function statusOf(c) {
  if (c.settled) return { k: 'done', t: 'مسدّد بالكامل ✓' };
  if (c.dueNow) return { k: 'due', t: c.overdueCount > 1 ? `متأخر ${c.overdueCount} أقساط` : 'مستحق' };
  if (c.paidThisMonth) return { k: 'paid', t: '✓ مسدَّد هذا الشهر' };
  if (c.soon) return { k: 'soon', t: c.daysToNext === 0 ? 'اليوم' : c.daysToNext === 1 ? 'غداً' : `بعد ${daysAr(c.daysToNext)}` };
  return null;
}
const dirLabel = d => d.dir === 'in' ? 'لك عنده' : 'عليك له';
function waPhone(p) {
  let d = normDigits(p).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 8) d = '968' + d;
  return d;
}

/* ---------- الحالة والتنقل ---------- */
let view = { name: 'home' };
let filter = 'all';
let frontId = null;
let curSheet = null;
let share = null; // حالة شاشة المشاركة
let locked = false;

function go(v) { view = v; render(); window.scrollTo(0, 0); }
function applyMode() { document.documentElement.dataset.mode = S.settings.mode || 'auto'; }

const IC = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M15 11.5c3.3 0 6 1.3 6 3v3c0 1.7-2.7 3-6 3-2 0-3.8-.5-4.9-1.3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12l-8 8a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4 4l-9 9a1 1 0 0 1-2-2l8-8"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h4"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 10l4 4M17 10l-4 4"/></svg>',
  face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1M15 9v1M12 9v4h-1M9 16a4 4 0 0 0 6 0"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const modeIcon = () => IC[{ auto: 'auto', light: 'sun', dark: 'moon' }[S.settings.mode] || 'auto'];
const modeName = m => ({ auto: 'تلقائي', light: 'نهاري', dark: 'ليلي' }[m]);

/* ---------- البطاقة المربعة ---------- */
function segsHTML(c, col) {
  const sc = segColors(col);
  if (c.m > 0 && c.cycles <= 24) {
    let s = '';
    for (let i = 0; i < c.cycles; i++) {
      let bg = sc.off;
      if (i < c.paidCycles) bg = sc.on;
      else if (i === c.paidCycles && c.paid - c.paidCycles * c.m > 0.0005) bg = sc.part;
      if (i >= c.paidCycles && i < c.elapsed) bg = (bg === sc.part) ? sc.part : sc.due;
      s += `<span style="background:${bg}"></span>`;
    }
    return `<span class="segs" style="grid-template-columns:repeat(${c.cycles},minmax(0,1fr))" aria-hidden="true">${s}</span>`;
  }
  return `<span class="bar" style="background:${sc.off}" aria-hidden="true"><span style="width:${c.pct.toFixed(1)}%;background:${sc.on}"></span></span>`;
}
function progText(c) {
  if (c.m > 0) return `${c.paidCycles} من ${c.cycles} أقساط · سُدّد ${Math.round(c.pct)}٪`;
  return `سُدّد ${fmt(c.paid)} من ${fmt(c.total)} · ${Math.round(c.pct)}٪`;
}
function footHTML(d, c) {
  const cell = (l, v) => `<span>${l}<b class="num">${v}</b></span>`;
  if (c.m > 0 && !c.settled) return cell('القسط', fmt(c.m) + ' ر.ع') + cell('الاستحقاق', fDM(c.nextDate)) + cell('النهاية', fMY(c.endDate));
  if (c.settled) return cell('الإجمالي', fmt(c.total) + ' ر.ع') + cell('آخر دفعة', c.lastPay ? fDM(pd(c.lastPay)) : '—') + cell('البدء', fMY(pd(d.start)));
  return cell('الإجمالي', fmt(c.total) + ' ر.ع') + cell('المسدَّد', fmt(c.paid) + ' ر.ع') + cell('البدء', fDM(pd(d.start)));
}
function infoLines(d, c) {
  const L = [];
  if (c.settled) L.push('تمت تسوية الحساب بالكامل');
  else if (c.dueNow) L.push(`<b>مستحق الآن: ${fmt(c.behind)} ر.ع</b> · منذ ${fDM(c.nextDate)}`);
  else if (c.m > 0) L.push(`القسط القادم ${c.daysToNext === 0 ? 'اليوم' : c.daysToNext === 1 ? 'غداً' : 'بعد ' + daysAr(c.daysToNext)} · ${fmt(c.nextAmount)} ر.ع`);
  else L.push('بدون أقساط شهرية');
  const last = (d.payments || []).map((p, i) => [p, i]).sort((x, y) => x[0].date.localeCompare(y[0].date) || x[1] - y[1]).map(x => x[0]).pop();
  L.push(last ? `آخر دفعة ${fDM(pd(last.date))} · ${fmt(last.amount)} ر.ع` : 'لا توجد دفعات بعد');
  return L.map(x => `<span>${x}</span>`).join('');
}
function passHTML(d, c, opt = {}) {
  const col = COL(d.color);
  const cls = 'pass' + (col.id === 'white' ? ' white' : '') + (opt.static ? ' static' : '');
  const style = `background:${col.bg};color:${col.ink};` + (opt.static ? '' : `top:calc(${opt.i} * 56px);z-index:${opt.i + 1};`);
  const st = statusOf(c);
  const chip = st ? `<span class="pchip ${st.k}">${st.t}</span>` : '';
  const sign = d.dir === 'in' ? '+' : MINUS;
  const demo = d.demo ? ' · مثال' : '';
  const head = `<span class="p-head"><span class="p-name"><b>${esc(d.name)}</b>${opt.back ? '' : `<span>${dirLabel(d)} · منذ ${fDM(pd(d.start))}${demo}</span>`}</span><span class="p-right">${chip}${opt.back ? `<span class="p-mini num">${signed(c.remaining, sign)}</span>` : ''}</span></span>`;
  if (opt.back) return `<button class="${cls}" style="${style}" data-a="front" data-id="${d.id}" aria-label="إظهار بطاقة ${esc(d.name)}">${head}</button>`;
  const body = `${head}
    <span class="p-amt"><small>${c.settled ? 'تم السداد بالكامل' : 'المتبقي من ' + fmt(c.total) + ' ر.ع'}</small><b class="num">${fmt(c.remaining)} <i>ر.ع</i></b></span>
    ${segsHTML(c, col)}
    <span class="p-prog">${progText(c)}</span>
    <span class="p-info">${infoLines(d, c)}</span>
    <span class="p-foot">${footHTML(d, c)}</span>`;
  if (opt.static) return `<div class="${cls}" style="${style}">${body}</div>`;
  return `<button class="${cls}" style="${style}" data-a="open" data-id="${d.id}" aria-label="فتح تفاصيل ${esc(d.name)}">${body}</button>`;
}

/* ---------- الشاشة الرئيسية ---------- */
function vHome() {
  const all = S.debts;
  const cs = new Map(all.map(d => [d.id, calc(d)]));
  let tin = 0, tout = 0;
  all.forEach(d => { const c = cs.get(d.id); if (d.dir === 'in') tin += c.remaining; else tout += c.remaining; });
  const net = r3(tin - tout);
  let h = `<header class="top">
      <div class="brand"><img src="icons/icon-180.png" alt=""><b>أمانة</b></div>
      <div class="top-actions">
        <button class="ibtn" data-a="mode" aria-label="المظهر: ${modeName(S.settings.mode)}">${modeIcon()}</button>
        <button class="ibtn" data-a="settings" aria-label="الإعدادات">${IC.gear}</button>
        <button class="ibtn inv" data-a="add" aria-label="سلفية جديدة" style="color:var(--inv-ink)">${IC.plus}</button>
      </div>
    </header>
    <section class="sum" aria-label="الملخص">
      <div class="tile"><small>لك</small><b class="num plus">${fmt(tin)}</b></div>
      <div class="tile"><small>عليك</small><b class="num minus">${fmt(tout)}</b></div>
      <div class="tile inv"><small>الصافي ${net >= 0 ? 'لك' : 'عليك'}</small><b class="num">${net === 0 ? '0' : signed(Math.abs(net), net > 0 ? '+' : MINUS)}</b></div>
    </section>`;

  if (all.some(d => d.demo)) h += `<div class="note-bar"><span style="flex:1">تعرض الآن بيانات تجريبية للتوضيح.</span><button data-a="cleardemo">حذف الأمثلة</button></div>`;

  const due = all.filter(d => cs.get(d.id).dueNow);
  const soon = all.filter(d => cs.get(d.id).soon);
  due.forEach(d => {
    const c = cs.get(d.id);
    h += `<div class="banner" role="alert"><span class="dot"></span><span class="txt"><b>${d.dir === 'in' ? 'قسط ' + esc(d.name) + ' مستحق' : 'قسطك لـ' + esc(d.name) + ' مستحق'}</b><span class="num">${fmt(c.payNow)} ر.ع · كان موعده ${fDM(c.nextDate)}</span></span><button class="act" data-a="paymonth" data-id="${d.id}">تم التسديد</button></div>`;
  });
  soon.forEach(d => {
    const c = cs.get(d.id);
    const when = c.daysToNext === 0 ? 'اليوم' : c.daysToNext === 1 ? 'غداً' : `بعد ${daysAr(c.daysToNext)}`;
    h += `<div class="banner soon"><span class="dot"></span><span class="txt"><b>قسط ${esc(d.name)} ${when}</b><span class="num">${fmt(c.nextAmount)} ر.ع · ${fDM(c.nextDate)}</span></span><button class="act" data-a="paymonth" data-id="${d.id}">تم التسديد</button></div>`;
  });

  if (!all.length) {
    h += `<div class="empty"><img src="icons/icon-180.png" alt=""><b>ابدأ بأول سلفية</b><p>سجّل من سلّفته أو تسلّفت منه، وأمانة تحسب لك الأقساط وموعد نهاية السداد.</p>
      <button class="btn" data-a="add" style="max-width:260px">${IC.plus} سلفية جديدة</button>
      <button class="btn ghost" data-a="demo" style="max-width:260px;height:46px">عرض أمثلة توضيحية</button></div>`;
    return h;
  }

  const counts = { all: all.filter(d => !cs.get(d.id).settled).length, in: all.filter(d => d.dir === 'in' && !cs.get(d.id).settled).length, out: all.filter(d => d.dir === 'out' && !cs.get(d.id).settled).length, done: all.filter(d => cs.get(d.id).settled).length };
  const chip = (k, t) => `<button class="fchip" data-a="filter" data-f="${k}" aria-pressed="${filter === k}">${t} ${counts[k] ? '<span class="num">' + counts[k] + '</span>' : ''}</button>`;
  h += `<nav class="chips" aria-label="تصفية">${chip('all', 'الكل')}${chip('in', 'لك')}${chip('out', 'عليك')}${chip('done', 'مسدّدة')}</nav>`;

  let list = all.filter(d => {
    const c = cs.get(d.id);
    if (filter === 'done') return c.settled;
    if (c.settled) return false;
    return filter === 'all' || d.dir === filter;
  });
  const prio = d => { const c = cs.get(d.id); return c.dueNow ? 0 : c.soon ? 1 : c.settled ? 3 : 2; };
  list.sort((a, b) => {
    const pa = prio(a), pb = prio(b); if (pa !== pb) return pa - pb;
    const ca = cs.get(a.id), cb = cs.get(b.id);
    const na = ca.nextDate ? +ca.nextDate : Infinity, nb = cb.nextDate ? +cb.nextDate : Infinity;
    if (na !== nb) return na - nb;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  if (!list.length) {
    h += `<p class="hint" style="padding:40px 0">${filter === 'done' ? 'لا توجد سلفيات مسدّدة بالكامل بعد.' : 'لا توجد سلفيات هنا.'}</p>`;
    return h;
  }
  const front = list.find(d => d.id === frontId) || list[0];
  const back = list.filter(d => d !== front).reverse();
  const n = back.length;
  h += `<div class="stack" style="height:calc(${n} * 56px + var(--cw))">`;
  back.forEach((d, i) => { h += passHTML(d, cs.get(d.id), { back: true, i }); });
  h += passHTML(front, cs.get(front.id), { i: n });
  h += `</div><p class="hint">${n ? 'اضغط على أي بطاقة لتنتقل إلى المقدمة' : 'اضغط على البطاقة لعرض التفاصيل'}</p>`;
  return h;
}

/* ---------- تفاصيل الشخص ---------- */
function vDetail() {
  const d = getDebt(view.id); if (!d) { view = { name: 'home' }; return vHome(); }
  const c = calc(d);
  let h = `<header class="top"><button class="back" data-a="home">${IC.back}البطاقات</button><span class="title">${esc(d.name)}</span><button class="ibtn" data-a="edit" data-id="${d.id}" aria-label="تعديل">${IC.edit}</button></header>`;
  h += passHTML(d, c, { static: true });

  if (!c.settled) {
    if (c.m > 0) {
      if (c.paidThisMonth && !c.dueNow) {
        h += `<div class="calc">✓ مسدَّد هذا الشهر<small>القسط القادم ${fDM(c.nextDate)} · ${fmt(c.nextAmount)} ر.ع</small></div>`;
        h += `<button class="btn ghost" data-a="paymonth" data-id="${d.id}">تسديد القسط القادم مبكراً · ${fmt(c.payNow)} ر.ع</button>`;
      } else {
        h += `<button class="btn" data-a="paymonth" data-id="${d.id}">${IC.check} تم تسديد قسط هذا الشهر · <span class="num">${fmt(c.payNow)}</span> ر.ع</button>`;
      }
    } else {
      h += `<button class="btn" data-a="pay" data-id="${d.id}">${IC.coins} تسجيل دفعة</button>`;
    }
  }
  const tel = d.phone ? waPhone(d.phone) : '';
  h += `<div class="acts">
    ${tel ? `<a class="act" href="tel:+${tel}">${IC.phone}اتصال</a>` : `<button class="act" data-a="edit" data-id="${d.id}">${IC.phone}أضف رقماً</button>`}
    <button class="act" data-a="share" data-id="${d.id}">${IC.wa}واتساب</button>
    <button class="act" data-a="pay" data-id="${d.id}" ${c.settled ? 'disabled style="opacity:.45"' : ''}>${IC.coins}دفعة جزئية</button>
    <button class="act" data-a="share" data-id="${d.id}">${IC.doc}كشف</button>
  </div>`;

  const pays = (d.payments || []).map((p, i) => [p, i]).sort((x, y) => y[0].date.localeCompare(x[0].date) || y[1] - x[1]).map(x => x[0]);
  h += `<section class="panel"><h3>سجل الدفعات <small>${pays.length ? pays.length + ' دفعات · ' + fmt(c.paid) + ' ر.ع' : 'لا توجد دفعات بعد'}</small></h3>`;
  pays.forEach(p => {
    const hasAtt = (d.attachments || []).some(a => a.payId === p.id);
    const kind = p.kind === 'installment' ? 'قسط ' + fMon(pd(p.date)) : p.kind === 'partial' ? 'دفعة جزئية' : 'دفعة';
    h += `<div class="li"><span class="l"><span>${kind}${p.note ? ' · ' + esc(p.note) : ''}</span><small>${fDate(pd(p.date))}${hasAtt ? ' · مع إيصال' : ''}</small></span><span class="r"><span class="num ${d.dir === 'in' ? 'plus' : 'minus'}">${fmt(p.amount)} ر.ع</span><button class="x" data-a="delpay" data-id="${d.id}" data-p="${p.id}" aria-label="حذف الدفعة">${IC.trash}</button></span></div>`;
  });
  h += `</section>`;

  const atts = d.attachments || [];
  h += `<section class="panel"><h3>المرفقات والإثباتات <small>${atts.length || ''}</small></h3><div class="atts">`;
  atts.forEach(a => {
    const lbl = a.kind === 'receipt' ? 'إيصال' : a.kind === 'agreement' ? 'اتفاق' : 'مستند';
    h += `<button class="att" data-a="viewatt" data-id="${d.id}" data-att="${a.id}">${a.type === 'image' ? `<img data-fid="${a.id}" alt="">` : IC.doc}<span class="lbl">${lbl} · ${fDM(pd(a.date))}</span></button>`;
  });
  h += `<button class="att add" data-a="addatt" data-id="${d.id}">${IC.clip}إرفاق</button></div></section>`;

  h += `<section class="panel"><h3>معلومات</h3>
    <div class="li"><span class="muted">النوع</span><span>${d.dir === 'in' ? 'سلّفتُه (لك)' : 'تسلّفتُ منه (عليك)'}</span></div>
    <div class="li"><span class="muted">الهاتف</span><span class="num" dir="ltr">${d.phone ? '+' + esc(waPhone(d.phone)) : '—'}</span></div>
    <div class="li"><span class="muted">المبلغ الإجمالي</span><span class="num">${fmt(c.total)} ر.ع</span></div>
    <div class="li"><span class="muted">تاريخ البدء</span><span>${fDate(pd(d.start))}</span></div>
    ${c.m > 0 ? `<div class="li"><span class="muted">القسط الشهري</span><span class="num">${fmt(c.m)} ر.ع · يوم ${d.dueDay}</span></div>
    <div class="li"><span class="muted">نهاية السداد</span><span>${fMY(c.endDate)} · ${c.cycles} أقساط</span></div>` : ''}
    ${d.note ? `<div class="li"><span class="muted">ملاحظة</span><span style="text-align:left">${esc(d.note)}</span></div>` : ''}
  </section>
  <button class="btn danger" data-a="deldebt" data-id="${d.id}">حذف هذه السلفية</button>`;
  return h;
}

/* ---------- المشاركة ---------- */
function shareDefaults(d) {
  const c = calc(d);
  const me = S.settings.myName.trim() || 'أنا';
  const creditor = d.dir === 'in' ? me : d.name;
  const debtor = d.dir === 'in' ? d.name : me;
  const show = S.settings.share.show;
  const lastUpd = c.lastPay ? pd(c.lastPay) : new Date(d.updatedAt || Date.now());
  const vals = {
    title: 'كشف حساب سلفية',
    parties: `الدائن: ${creditor} · المدين: ${debtor}`,
    date: 'صدر ' + fDate(today()),
    remaining: fmt(c.remaining),
    progress: progText(c),
    total: fmt(c.total) + ' ر.ع',
    paid: fmt(c.paid) + ' ر.ع',
    monthly: c.m > 0 ? fmt(c.m) + ' ر.ع' : '',
    due: c.m > 0 && !c.settled ? fDate(c.nextDate) : '',
    updated: fDate(lastUpd),
    note: 'هذا المستند هو ملخص مالي شخصي توثيقي بين الطرفين.',
  };
  const rows = {};
  SHARE_KEYS.forEach(k => { rows[k] = { on: show[k] !== false && vals[k] !== '', val: vals[k] }; });
  return { id: d.id, brand: S.settings.share.brand !== false, rows, msg: fillTpl(d, c) };
}
const SHARE_LABELS = { title: 'العنوان', parties: 'الطرفان', date: 'التاريخ', remaining: 'المتبقي', progress: 'شريط السداد', total: 'الإجمالي', paid: 'المسدَّد', monthly: 'القسط', due: 'الاستحقاق', updated: 'آخر تحديث', note: 'الملاحظة' };
function fillTpl(d, c) {
  const tpl = d.dir === 'in' ? S.settings.tplIn : S.settings.tplOut;
  const hasPlan = c.m > 0 && !c.settled;
  const map = {
    '{الاسم}': d.name.split(' ')[0] || d.name,
    '{الإجمالي}': fmt(c.total), '{المسدد}': fmt(c.paid), '{المتبقي}': fmt(c.remaining),
    '{القسط}': hasPlan ? fmt(c.payNow) : '', '{الموعد}': hasPlan ? fDate(c.nextDate) : '',
  };
  return tpl.split('\n')
    .filter(line => hasPlan || !(line.includes('{القسط}') || line.includes('{الموعد}')))
    .map(line => line.replace(/\{[^}]+\}/g, m => (m in map ? map[m] : m)))
    .join('\n');
}
function waLink(d, text) {
  const p = d.phone ? waPhone(d.phone) : '';
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
function vShare() {
  const d = getDebt(view.id); if (!d) { view = { name: 'home' }; return vHome(); }
  if (!share || share.id !== d.id) share = shareDefaults(d);
  let h = `<header class="top"><button class="back" data-a="open" data-id="${d.id}">${IC.back}${esc(d.name)}</button><span class="title">مشاركة الكشف</span><span style="width:44px"></span></header>
    <div class="preview"><img id="prev" alt="معاينة بطاقة الكشف"></div>
    <div class="row2">
      <button class="btn" data-a="shareimg">${IC.share} مشاركة الصورة</button>
      <button class="btn ghost" data-a="sharepdf">${IC.doc} ملف PDF</button>
    </div>
    <p class="sec-t">بيانات البطاقة — عدّل النص أو أخفِ ما لا تريده</p>
    <div class="form" id="shfields">
      <label class="trow"><span class="tl" style="flex:1;width:auto;color:var(--ink);font-weight:700">اسم وشعار أمانة</span><span class="switch"><input type="checkbox" id="sh-brand" ${share.brand ? 'checked' : ''} aria-label="إظهار اسم وشعار أمانة"><i></i></span></label>`;
  SHARE_KEYS.forEach(k => {
    const r = share.rows[k];
    h += `<div class="trow"><span class="switch"><input type="checkbox" data-k="${k}" ${r.on ? 'checked' : ''} aria-label="إظهار ${SHARE_LABELS[k]}"><i></i></span><span class="tl">${SHARE_LABELS[k]}</span><input type="text" id="sh-${k}" data-v="${k}" value="${esc(r.val)}" ${r.on ? '' : 'disabled'} aria-label="${SHARE_LABELS[k]}"></div>`;
  });
  h += `</div>
    <p class="sec-t">نص الرسالة</p>
    <textarea id="sh-msg" aria-label="نص الرسالة">${esc(share.msg)}</textarea>
    <div class="qchips"><button class="qchip" data-a="msgreset">استعادة النص</button><button class="qchip" data-a="msgcopy">نسخ النص</button><button class="qchip" data-a="tpl">تعديل القالب الدائم</button></div>
    <a class="btn wa" id="wa-link" href="${esc(waLink(d, share.msg))}" target="_blank" rel="noopener">${IC.wa} إرسال النص عبر واتساب${d.phone ? '' : ' (اختر جهة الاتصال)'}</a>
    <p class="hint">لإرسال الصورة مع الرسالة: اضغط «مشاركة الصورة» ثم اختر واتساب.</p>`;
  return h;
}
let prevTimer = 0, prevURL = '';
function schedulePreview() { clearTimeout(prevTimer); prevTimer = setTimeout(updatePreview, 120); }
async function updatePreview() {
  const d = getDebt(share?.id); const img = $('#prev'); if (!d || !img) return;
  const cv = await drawCard(d, share);
  cv.toBlob(b => { if (!b) return; if (prevURL) URL.revokeObjectURL(prevURL); prevURL = URL.createObjectURL(b); const i = $('#prev'); if (i) i.src = prevURL; }, 'image/png');
}
function bindShare() {
  const d = getDebt(share.id);
  const wrap = $('#shfields');
  wrap.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.v) { share.rows[t.dataset.v].val = t.value; schedulePreview(); }
  });
  wrap.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'sh-brand') { share.brand = t.checked; S.settings.share.brand = t.checked; save(); schedulePreview(); }
    else if (t.dataset.k) {
      const k = t.dataset.k; share.rows[k].on = t.checked; S.settings.share.show[k] = t.checked; save();
      const inp = $('#sh-' + k); if (inp) inp.disabled = !t.checked; schedulePreview();
    }
  });
  const ta = $('#sh-msg'); const fit = () => { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 4) + 'px'; }; fit();
  ta.addEventListener('input', e => { share.msg = e.target.value; $('#wa-link').href = waLink(d, share.msg); fit(); });
  updatePreview();
}

/* ---------- رسم بطاقة الكشف (مربعة 1080×1080) ---------- */
let _fontsOK = null;
function fontsReady() {
  if (!_fontsOK) _fontsOK = Promise.all(['400', '700', '800'].map(w => document.fonts.load(`${w} 40px Almarai`, 'أمانة 123'))).catch(() => {});
  return _fontsOK;
}
function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function drawMark(x, X, Y, s, white) {
  const k = s / 200;
  x.save(); x.translate(X, Y); x.scale(k, k);
  rr(x, 0, 0, 200, 200, 46); x.fillStyle = '#FFFFFF'; x.fill();
  if (white) { x.lineWidth = 4; x.strokeStyle = '#DADDE2'; x.stroke(); }
  rr(x, 62, 38, 76, 76, 18); x.fillStyle = '#C9A45C'; x.fill();
  rr(x, 54, 52, 92, 92, 22); x.fillStyle = '#6B3E75'; x.fill();
  rr(x, 46, 68, 108, 108, 26); x.fillStyle = '#1F6F78'; x.fill();
  x.beginPath(); x.moveTo(76, 122); x.lineTo(94, 140); x.lineTo(126, 106);
  x.strokeStyle = '#FFFFFF'; x.lineWidth = 10; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
  x.restore();
}
function fitFont(x, text, maxW, w, size, min = 18) {
  let s = size; x.font = `${w} ${s}px Almarai, Tahoma, sans-serif`;
  while (s > min && x.measureText(text).width > maxW) { s -= 2; x.font = `${w} ${s}px Almarai, Tahoma, sans-serif`; }
  return s;
}
async function drawCard(d, st) {
  await fontsReady();
  const c = calc(d);
  const W = 1080, P = 84, IW = W - 2 * P;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = W;
  const x = cv.getContext('2d');
  const col = COL(d.color); const white = col.id === 'white';
  const ink = col.ink, sub = white ? '#5D6470' : col.sub;
  x.fillStyle = col.bg; x.fillRect(0, 0, W, W);
  if (white) { x.strokeStyle = '#DADDE2'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, W - 6); }
  x.direction = 'rtl'; x.textBaseline = 'alphabetic';
  const R = st.rows; const on = k => R[k] && R[k].on && (k === 'progress' || String(R[k].val).trim() !== '');
  let y = P;

  if (st.brand || on('date')) {
    const H = 88;
    if (st.brand) {
      drawMark(x, W - P - H, y, H, white);
      x.fillStyle = ink; x.font = '800 54px Almarai, Tahoma, sans-serif'; x.textAlign = 'right';
      x.fillText('أمانة', W - P - H - 24, y + H / 2 + 19);
    }
    if (on('date')) {
      x.fillStyle = sub; x.textAlign = 'left';
      fitFont(x, R.date.val, st.brand ? IW - H - 240 : IW, 400, 32);
      x.fillText(R.date.val, P, y + H / 2 + 11);
    }
    y += H + 44;
  }
  if (on('title')) {
    x.fillStyle = ink; x.textAlign = 'right'; const s = fitFont(x, R.title.val, IW, 800, 50);
    x.fillText(R.title.val, W - P, y + s); y += s + 20;
  }
  if (on('parties')) {
    x.fillStyle = sub; x.textAlign = 'right'; const s = fitFont(x, R.parties.val, IW, 400, 34);
    x.fillText(R.parties.val, W - P, y + s); y += s + 26;
  }

  // من الأسفل
  let yb = W - P;
  if (on('note')) {
    x.fillStyle = sub; x.textAlign = 'right'; const s = fitFont(x, R.note.val, IW, 400, 28, 16);
    x.fillText(R.note.val, W - P, yb); yb -= s + 22;
    x.save(); x.strokeStyle = white ? '#D5D9DF' : 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.setLineDash([10, 8]);
    x.beginPath(); x.moveTo(P, yb); x.lineTo(W - P, yb); x.stroke(); x.restore();
    yb -= 30;
  }
  const fk = ['total', 'paid', 'monthly', 'due', 'updated'].filter(on);
  if (fk.length) {
    const cols = 3, cw = IW / cols, cellH = 98, gap = 22, rows = Math.ceil(fk.length / cols);
    const top = yb - (rows * cellH + (rows - 1) * gap);
    fk.forEach((k, i) => {
      const cx = W - P - (i % cols) * cw, cy = top + Math.floor(i / cols) * (cellH + gap);
      x.textAlign = 'right';
      x.fillStyle = sub; x.font = '400 28px Almarai, Tahoma, sans-serif'; x.fillText(SHARE_LABELS[k], cx, cy + 28);
      x.fillStyle = ink; fitFont(x, R[k].val, cw - 24, 800, 40, 20); x.fillText(R[k].val, cx, cy + 28 + 52);
    });
    yb = top - 40;
  }

  // الوسط: المتبقي + شريط السداد
  const showProg = on('progress');
  const progTxt = showProg ? String(R.progress.val || '').trim() : '';
  const progH = showProg ? 20 + (progTxt ? 16 + 32 : 0) : 0;
  const showRem = on('remaining');
  const avail = yb - y - 10;
  if (showRem) {
    const label = 'المتبقي';
    let S2 = Math.min(176, avail - progH - (showProg ? 30 : 0) - 46);
    const showLabel = S2 >= 70;
    if (!showLabel) S2 = Math.min(176, avail - progH - (showProg ? 30 : 0));
    S2 = Math.max(48, S2);
    const blockH = (showLabel ? 46 : 0) + S2 + (showProg ? 30 + progH : 0);
    let yy = y + Math.max(0, (avail - blockH) / 2);
    if (showLabel) { x.fillStyle = sub; x.textAlign = 'right'; x.font = '400 32px Almarai, Tahoma, sans-serif'; x.fillText(label, W - P, yy + 32); yy += 46; }
    const val = String(R.remaining.val).trim();
    const numeric = /^[\d.,\s]+$/.test(val);
    x.fillStyle = ink; x.textAlign = 'right';
    const s = fitFont(x, val, IW - (numeric ? 150 : 0), 800, S2, 30);
    x.fillText(val, W - P, yy + s * 0.92);
    if (numeric) {
      const wv = x.measureText(val).width;
      x.font = `400 ${Math.round(s * 0.32)}px Almarai, Tahoma, sans-serif`; x.fillStyle = sub;
      x.fillText('ر.ع', W - P - wv - 18, yy + s * 0.92);
    }
    yy += s + 30;
    if (showProg) drawProg(x, c, col, P, yy, IW, progTxt, sub);
  } else if (showProg) {
    drawProg(x, c, col, P, y + Math.max(0, (avail - progH) / 2), IW, progTxt, sub);
  }
  return cv;
}
function drawProg(x, c, col, P, y, IW, txt, sub) {
  const sc = segColors(col); const H = 20;
  if (c.m > 0 && c.cycles <= 24) {
    const g = 8, sw = (IW - g * (c.cycles - 1)) / c.cycles;
    for (let i = 0; i < c.cycles; i++) {
      let bg = sc.off;
      if (i < c.paidCycles) bg = sc.on;
      else if (i === c.paidCycles && c.paid - c.paidCycles * c.m > 0.0005) bg = sc.part;
      if (i >= c.paidCycles && i < c.elapsed && bg !== sc.part) bg = sc.due;
      const X = P + IW - (i + 1) * sw - i * g;
      rr(x, X, y, sw, H, 8); x.fillStyle = bg; x.fill();
    }
  } else {
    rr(x, P, y, IW, H, 10); x.fillStyle = sc.off; x.fill();
    const w = IW * c.pct / 100; if (w > 1) { rr(x, P + IW - w, y, w, H, 10); x.fillStyle = sc.on; x.fill(); }
  }
  if (txt) { x.fillStyle = sub; x.textAlign = 'right'; fitFont(x, txt, IW, 400, 32); x.fillText(txt, P + IW, y + H + 16 + 30); }
}
async function cardBlob(d, type) {
  const cv = await drawCard(d, share);
  if (type === 'pdf') {
    if (!window.jspdf) { toast('مكتبة PDF لم تُحمّل بعد، حاول مجدداً'); return null; }
    const pdf = new window.jspdf.jsPDF({ unit: 'px', format: [1080, 1080], hotfixes: ['px_scaling'] });
    pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 1080, 1080);
    return pdf.output('blob');
  }
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function shareFile(blob, name, text) {
  if (isNative) {
    await nativeReady;
    const fs = NP('Filesystem'), sh = NP('Share');
    if (fs && sh) {
      try {
        const b64 = (await blobToDataURL(blob)).split(',')[1];
        const safe = name.replace(/[\\/:*?"<>|]/g, '-');
        const w = await fs.writeFile({ path: safe, data: b64, directory: 'CACHE' });
        await sh.share(text ? { title: safe, text, files: [w.uri] } : { title: safe, files: [w.uri] });
        return true;
      } catch (e) { if (/cancel/i.test(String(e && (e.message || e)))) return false; toast('تعذّرت المشاركة'); return false; }
    }
  }
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share(text ? { files: [file], text } : { files: [file] }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  try {
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    toast('تم تجهيز الملف للتنزيل');
  } catch (e) { toast('المشاركة غير متاحة هنا'); }
  return true;
}

/* ---------- الإعدادات ---------- */
function vSettings() {
  const st = S.settings;
  const seg = (name, val, opts) => `<div class="seg" role="group">${opts.map(([v, t]) => `<button data-a="set" data-k="${name}" data-v="${v}" aria-pressed="${String(val) === String(v)}">${t}</button>`).join('')}</div>`;
  const hasWebAuthn = isNative || !!(window.PublicKeyCredential && navigator.credentials);
  const hrs = Array.from({ length: 18 }, (_, i) => i + 6).map(h => `<option value="${h}" ${+st.notifyHour === h ? 'selected' : ''}>${(h % 12) || 12}:00 ${h < 12 ? 'صباحاً' : 'مساءً'}</option>`).join('');
  const notiHTML = isNative ? `<p class="sec-t">تنبيهات الجوال</p>
    <div class="form">
      <label class="fld" style="color:var(--ink)">تنبيهات الأقساط<span class="switch"><input type="checkbox" id="st-notify" ${st.notify ? 'checked' : ''}><i></i></span></label>
      <label class="fld">وقت التنبيه<select id="st-hour" style="text-align:left">${hrs}</select></label>
      <button class="fld" data-a="testnoti" style="color:var(--ink)">تجربة تنبيه بعد 5 ثوانٍ</button>
    </div>
    <p class="hint" style="text-align:right">تصل التنبيهات والتطبيق مغلق: قبل الموعد، ويوم الموعد، ثم يومياً حتى تسجّل التسديد. وزر «تم التسديد ✓» يظهر في التنبيه نفسه.</p>`
    : `<p class="hint" style="text-align:right">تنبيهات الجوال والتطبيق مغلق متاحة في نسخة الآيفون (IPA).</p>`;
  return `<header class="top"><button class="back" data-a="home">${IC.back}البطاقات</button><span class="title">الإعدادات</span><span style="width:44px"></span></header>
    <p class="sec-t">اسمك (يظهر في الكشوفات)</p>
    <div class="form"><label class="fld">الاسم<input id="st-name" value="${esc(st.myName)}" placeholder="مثلاً: أحمد" autocomplete="name"></label></div>
    <p class="sec-t">المظهر</p>${seg('mode', st.mode, [['auto', 'تلقائي'], ['light', 'نهاري'], ['dark', 'ليلي']])}
    <p class="sec-t">التنبيه قبل موعد القسط</p>${seg('remindDays', st.remindDays, [[0, 'يوم الموعد'], [1, 'قبل يوم'], [3, 'قبل 3 أيام']])}
    <p class="hint" style="text-align:right">يظهر التنبيه أعلى الشاشة الرئيسية كلما فتحت التطبيق، ويبقى حتى تضغط «تم التسديد».</p>
    ${notiHTML}
    <p class="sec-t">الرسائل</p>
    <div class="form"><button class="fld" data-a="tpl" style="color:var(--ink)">قوالب رسائل واتساب<span class="muted">${IC.back.replace('M9 6l6 6-6 6', 'M15 6l-6 6 6 6')}</span></button></div>
    <p class="sec-t">الحماية</p>
    <div class="form">
      <label class="fld" style="color:var(--ink)">قفل التطبيق برمز<span class="switch"><input type="checkbox" id="st-lock" ${st.pinHash ? 'checked' : ''}><i></i></span></label>
      ${st.pinHash && hasWebAuthn ? `<label class="fld" style="color:var(--ink)">فتح بـ Face ID / البصمة<span class="switch"><input type="checkbox" id="st-face" ${st.faceId ? 'checked' : ''}><i></i></span></label>` : ''}
      ${st.pinHash ? `<button class="fld" data-a="pinchange" style="color:var(--ink)">تغيير الرمز</button>` : ''}
    </div>
    <p class="sec-t">النسخة الاحتياطية</p>
    <div class="row2"><button class="btn ghost" data-a="export">${IC.share} تصدير</button><button class="btn ghost" data-a="import">استيراد</button></div>
    <p class="hint" style="text-align:right">البيانات محفوظة داخل جوالك فقط. صدّر نسخة احتياطية بين فترة وأخرى واحفظها في الملفات أو iCloud.</p>
    <button class="btn danger" data-a="wipe">حذف كل البيانات</button>
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 0">
      <img src="icons/icon-180.png" alt="" style="width:56px;height:56px;border-radius:14px">
      <b>أمانة</b><span class="ver">الإصدار ${VERSION} · ديونك وحقوقك بوضوح</span>
    </div>`;
}
function bindSettings() {
  const nm = $('#st-name');
  nm.addEventListener('change', () => { S.settings.myName = nm.value.trim(); save(); toast('تم حفظ الاسم'); });
  $('#st-lock').addEventListener('change', e => {
    if (e.target.checked) { e.target.checked = false; pinSetup(); }
    else confirmSheet({ title: 'إيقاف القفل؟', text: 'سيفتح التطبيق بدون رمز.', ok: 'إيقاف القفل' }, () => { S.settings.pinHash = ''; S.settings.faceId = ''; save(); render(); }, () => render());
  });
  const nt = $('#st-notify');
  if (nt) nt.addEventListener('change', async e => {
    S.settings.notify = e.target.checked; save();
    if (e.target.checked) { const ok = await ensureNotifyPermission(); if (!ok) { toast('اسمح بالتنبيهات من إعدادات الآيفون ← أمانة'); } }
    scheduleNotis();
  });
  const hr = $('#st-hour');
  if (hr) hr.addEventListener('change', e => { S.settings.notifyHour = +e.target.value; save(); toast('تم تغيير وقت التنبيه'); });
  const f = $('#st-face');
  if (f) f.addEventListener('change', async e => {
    if (e.target.checked) { e.target.checked = false; await enableFaceId(); }
    else { S.settings.faceId = ''; save(); toast('تم إيقاف Face ID'); }
  });
}

/* ---------- النوافذ السفلية ---------- */
function openSheet(html, onMount) {
  closeSheet(true);
  const w = document.createElement('div'); w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${html}</div>`;
  w.addEventListener('click', e => { if (e.target === w || e.target.closest('[data-close]')) closeSheet(); });
  document.body.appendChild(w); curSheet = w;
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('on')));
  if (onMount) onMount(w.querySelector('.sheet'));
  return w;
}
function closeSheet(instant) {
  const w = curSheet; if (!w) return; curSheet = null;
  if (instant) { w.remove(); return; }
  w.classList.remove('on'); setTimeout(() => w.remove(), 300);
}
function confirmSheet(o, onOk, onCancel) {
  openSheet(`<b style="font-size:18px">${o.title}</b>${o.text ? `<p class="muted">${o.text}</p>` : ''}
    <button class="btn" id="cf-ok" style="${o.danger ? 'background:var(--minus);color:#fff' : ''}">${o.ok || 'تأكيد'}</button>
    <button class="btn ghost" id="cf-no" style="height:48px">إلغاء</button>`, sh => {
    $('#cf-ok', sh).onclick = () => { closeSheet(); onOk && onOk(); };
    $('#cf-no', sh).onclick = () => { closeSheet(); onCancel && onCancel(); };
  });
}

/* نموذج إضافة/تعديل سلفية */
function formSheet(id) {
  const d = id ? getDebt(id) : null;
  const usedColors = S.debts.map(x => x.color);
  const f = d ? { ...d } : {
    dir: 'in', name: '', phone: '', total: '', start: iso(today()), monthly: '', dueDay: today().getDate(), note: '',
    color: (COLORS.find(c => !usedColors.includes(c.id)) || COLORS[S.debts.length % COLORS.length]).id,
  };
  const days = Array.from({ length: 31 }, (_, i) => i + 1).map(n => `<option value="${n}" ${+f.dueDay === n ? 'selected' : ''}>${n}</option>`).join('');
  openSheet(`<div class="sh-top"><button data-close>إلغاء</button><b>${d ? 'تعديل السلفية' : 'سلفية جديدة'}</b><button class="save" id="fm-save">حفظ</button></div>
    <div class="seg" role="group" aria-label="نوع السلفية"><button data-dir="in" aria-pressed="${f.dir === 'in'}">سلّفتُه · لك</button><button data-dir="out" aria-pressed="${f.dir === 'out'}">تسلّفتُ منه · عليك</button></div>
    <div class="form">
      <label class="fld">الاسم<input id="fm-name" value="${esc(f.name)}" placeholder="اسم الشخص" autocomplete="off"></label>
      <label class="fld">الهاتف<input id="fm-phone" value="${esc(f.phone)}" placeholder="9123 4567" inputmode="tel" dir="ltr"></label>
      <label class="fld">المبلغ الإجمالي<input id="fm-total" value="${esc(f.total)}" placeholder="0" inputmode="decimal" dir="ltr"><span class="unit">ر.ع</span></label>
      <label class="fld">تاريخ البدء<input id="fm-start" type="date" value="${esc(f.start)}"></label>
      <label class="fld">القسط الشهري<input id="fm-monthly" value="${esc(f.monthly || '')}" placeholder="اختياري" inputmode="decimal" dir="ltr"><span class="unit">ر.ع</span></label>
      <label class="fld">يوم الاستحقاق<select id="fm-day" style="text-align:left">${days}</select></label>
      <label class="fld">ملاحظة<input id="fm-note" value="${esc(f.note || '')}" placeholder="اختياري"></label>
    </div>
    <div id="fm-calc" class="calc"></div>
    <p class="sec-t">لون البطاقة</p>
    <div class="swatches" role="group" aria-label="لون البطاقة">${COLORS.map(c => `<button class="sw ${c.id === 'white' ? 'white' : ''}" data-col="${c.id}" style="background:${c.bg}" aria-label="${c.name}" aria-pressed="${f.color === c.id}"></button>`).join('')}</div>
    <p class="err" id="fm-err"></p>
    ${d ? '' : '<p class="hint" style="text-align:right">تستطيع إرفاق صورة الإيصال أو ورقة الاتفاق من صفحة الشخص بعد الحفظ.</p>'}`, sh => {
    const upd = () => {
      const total = num($('#fm-total', sh).value), m = num($('#fm-monthly', sh).value);
      const col = COL(f.color); const box = $('#fm-calc', sh);
      box.style.background = col.bg; box.style.color = col.ink;
      if (col.id === 'white') box.style.outline = '1px solid #DADDE2'; else box.style.outline = '';
      const nm = $('#fm-name', sh).value.trim() || 'الاسم';
      const plan = planPreview(total, m, $('#fm-start', sh).value, +$('#fm-day', sh).value);
      let t = `${esc(nm)} · ${total > 0 ? fmt(total) + ' ر.ع' : '—'}`;
      let s = plan ? `${plan.cycles} أقساط${plan.last !== m ? ' (الأخير ' + fmt(plan.last) + ')' : ''} · أول قسط ${fDM(plan.first)} · ينتهي ${fMY(plan.end)}` : 'أدخل القسط الشهري ليحسب لك تاريخ نهاية السداد';
      box.innerHTML = `${t}<small style="color:inherit;opacity:.85">${s}</small>`;
    };
    sh.addEventListener('input', upd);
    sh.addEventListener('change', upd);
    $('#fm-start', sh).addEventListener('change', e => { const dd = pd(e.target.value).getDate(); if (!d) $('#fm-day', sh).value = dd; upd(); });
    sh.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { f.dir = b.dataset.dir; sh.querySelectorAll('[data-dir]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    sh.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { f.color = b.dataset.col; sh.querySelectorAll('[data-col]').forEach(x => x.setAttribute('aria-pressed', x === b)); upd(); });
    upd();
    $('#fm-save', sh).onclick = () => {
      const err = $('#fm-err', sh);
      const name = $('#fm-name', sh).value.trim();
      const total = num($('#fm-total', sh).value);
      const mRaw = $('#fm-monthly', sh).value.trim(); const m = mRaw ? num(mRaw) : 0;
      const start = $('#fm-start', sh).value;
      if (!name) return err.textContent = 'اكتب اسم الشخص.';
      if (!(total > 0)) return err.textContent = 'اكتب المبلغ الإجمالي بالأرقام.';
      if (!start) return err.textContent = 'اختر تاريخ البدء.';
      if (mRaw && !(m > 0)) return err.textContent = 'القسط الشهري يجب أن يكون رقماً أكبر من صفر، أو اتركه فارغاً.';
      if (m > total) return err.textContent = 'القسط الشهري أكبر من المبلغ الإجمالي.';
      if (d) {
        const paid = calc(d).paid; if (total < paid) return err.textContent = `المبلغ أقل من المسدَّد (${fmt(paid)} ر.ع).`;
      }
      const obj = d || { id: rid(), payments: [], attachments: [], createdAt: Date.now() };
      Object.assign(obj, { dir: f.dir, name, phone: $('#fm-phone', sh).value.trim(), total: r3(total), start, monthly: m ? r3(m) : 0, dueDay: +$('#fm-day', sh).value, note: $('#fm-note', sh).value.trim(), color: f.color, updatedAt: Date.now() });
      if (!d) S.debts.push(obj);
      save(); closeSheet();
      if (!d) { frontId = obj.id; filter = 'all'; go({ name: 'home' }); toast('تمت إضافة البطاقة'); }
      else { share = null; render(); toast('تم الحفظ'); }
    };
  });
}

/* دفعة جزئية / مخصصة */
function paySheet(id) {
  const d = getDebt(id); const c = calc(d);
  const def = c.m > 0 ? c.payNow : c.remaining;
  const chips = [];
  if (c.m > 0) { chips.push([c.payNow, 'القسط ' + fmt(c.payNow)]); chips.push([r3(c.payNow / 2), 'نصف القسط']); }
  chips.push([c.remaining, 'كامل المتبقي ' + fmt(c.remaining)]);
  openSheet(`<div class="sh-top"><button data-close>إلغاء</button><b>تسجيل دفعة</b><span style="width:40px"></span></div>
    <p class="muted" style="text-align:center">${esc(d.name)} · المتبقي ${fmt(c.remaining)} ر.ع</p>
    <div class="big-input"><input id="py-amt" value="${fmt(def).replace(/,/g, '')}" inputmode="decimal" dir="ltr" aria-label="المبلغ"><span class="muted">ر.ع</span></div>
    <div class="qchips" style="justify-content:center">${chips.map(([v, t]) => `<button class="qchip" data-v="${v}">${t}</button>`).join('')}</div>
    <div class="form">
      <label class="fld">التاريخ<input id="py-date" type="date" value="${iso(today())}"></label>
      <label class="fld">ملاحظة<input id="py-note" placeholder="اختياري"></label>
    </div>
    <p class="err" id="py-err"></p>
    <button class="btn" id="py-save">حفظ الدفعة</button>`, sh => {
    sh.querySelectorAll('.qchip').forEach(b => b.onclick = () => { $('#py-amt', sh).value = String(+b.dataset.v); });
    $('#py-save', sh).onclick = () => {
      const a = num($('#py-amt', sh).value); const err = $('#py-err', sh);
      if (!(a > 0)) return err.textContent = 'اكتب مبلغاً صحيحاً.';
      if (a > c.remaining + 0.0005) return err.textContent = `المبلغ أكبر من المتبقي (${fmt(c.remaining)} ر.ع).`;
      const kind = c.m > 0 && Math.abs(a - c.payNow) < 0.0005 ? 'installment' : 'partial';
      const p = { id: rid(), amount: r3(a), date: $('#py-date', sh).value || iso(today()), note: $('#py-note', sh).value.trim(), kind };
      addPayment(d, p);
    };
  });
}
function payMonth(id) {
  const d = getDebt(id); const c = calc(d);
  if (c.settled) return;
  if (!(c.m > 0)) return paySheet(id);
  addPayment(d, { id: rid(), amount: r3(c.payNow), date: iso(today()), note: '', kind: 'installment' });
}
function addPayment(d, p) {
  d.payments = d.payments || []; d.payments.push(p); d.updatedAt = Date.now();
  save(); share = null; render();
  const c = calc(d);
  openSheet(`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:8px 0">
      <span style="width:64px;height:64px;border-radius:50%;background:var(--ok-bg);color:var(--ok);display:grid;place-items:center"><span style="width:30px;height:30px;display:block">${IC.check}</span></span>
      <b style="font-size:18px">تم تسجيل ${fmt(p.amount)} ر.ع</b>
      <span class="muted">${c.settled ? 'تم سداد السلفية بالكامل 🎉' : c.paidThisMonth ? '✓ مسدَّد هذا الشهر · المتبقي ' + fmt(c.remaining) + ' ر.ع' : 'المتبقي ' + fmt(c.remaining) + ' ر.ع'}</span>
    </div>
    <button class="btn" id="rc-att">${IC.img} إرفاق صورة الإيصال</button>
    <button class="btn ghost" data-close style="height:48px">لاحقاً</button>
    <button class="btn danger" id="rc-undo" style="height:40px;font-size:13px">تراجع عن هذه الدفعة</button>`, sh => {
    $('#rc-att', sh).onclick = () => pickFile(file => { closeSheet(); addAttachment(d, file, 'receipt', p.id); });
    $('#rc-undo', sh).onclick = () => { d.payments = d.payments.filter(x => x.id !== p.id); save(); closeSheet(); render(); toast('تم التراجع'); };
  });
}

/* المرفقات */
function pickFile(cb) {
  const inp = $('#filepick'); inp.value = '';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) cb(f); };
  inp.click();
}
async function compressImage(file, max = 1800, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
  } finally { URL.revokeObjectURL(url); }
}
async function addAttachment(d, file, kind, payId) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isImg = file.type.startsWith('image/');
  if (!isPdf && !isImg) return toast('اختر صورة أو ملف PDF');
  if (file.size > 25 * 1024 * 1024) return toast('الملف أكبر من 25 ميجابايت');
  try {
    const blob = isImg ? (await compressImage(file)) || file : file;
    const id = rid();
    await fput(id, blob);
    d.attachments = d.attachments || [];
    d.attachments.push({ id, kind, name: file.name || (isPdf ? 'مستند.pdf' : 'صورة.jpg'), type: isPdf ? 'pdf' : 'image', date: iso(today()), payId: payId || null });
    d.updatedAt = Date.now(); save(); render(); toast('تم إرفاق الملف');
  } catch (e) { toast('تعذّر حفظ المرفق'); }
}
function attKindSheet(id) {
  const d = getDebt(id);
  openSheet(`<div class="sh-top"><button data-close>إلغاء</button><b>ماذا تريد أن ترفق؟</b><span style="width:40px"></span></div>
    <button class="btn ghost" data-k="receipt">${IC.img} إيصال تحويل بنكي</button>
    <button class="btn ghost" data-k="agreement">${IC.doc} ورقة الاتفاق الموقّعة</button>
    <button class="btn ghost" data-k="other">${IC.clip} مستند آخر</button>
    <p class="hint">صورة من الكاميرا أو الألبوم، أو ملف PDF.</p>`, sh => {
    sh.querySelectorAll('[data-k]').forEach(b => b.onclick = () => pickFile(file => { closeSheet(); addAttachment(d, file, b.dataset.k); }));
  });
}
async function viewAtt(id, attId) {
  const d = getDebt(id); const a = (d.attachments || []).find(x => x.id === attId); if (!a) return;
  const url = await fileURL(a.id);
  const lbl = a.kind === 'receipt' ? 'إيصال تحويل' : a.kind === 'agreement' ? 'ورقة الاتفاق' : 'مستند';
  openSheet(`<div class="sh-top"><button data-close>إغلاق</button><b>${lbl}</b><span style="width:40px"></span></div>
    <div class="viewer">${a.type === 'image' ? `<img src="${url}" alt="${lbl}">` : `<a class="btn ghost" href="${url}" target="_blank" rel="noopener">${IC.doc} فتح ملف PDF</a>`}</div>
    <p class="hint">${fDate(pd(a.date))}</p>
    <button class="btn ghost" id="av-share">${IC.share} مشاركة</button>
    <button class="btn danger" id="av-del">حذف المرفق</button>`, sh => {
    $('#av-share', sh).onclick = async () => { const b = await fget(a.id); if (b) shareFile(b, a.type === 'pdf' ? 'مستند.pdf' : 'إيصال.jpg'); };
    $('#av-del', sh).onclick = () => confirmSheet({ title: 'حذف المرفق؟', ok: 'حذف', danger: true }, async () => {
      d.attachments = d.attachments.filter(x => x.id !== a.id); save();
      try { await fdel(a.id); } catch (e) {}
      if (urlCache.has(a.id)) { URL.revokeObjectURL(urlCache.get(a.id)); urlCache.delete(a.id); }
      render(); toast('تم حذف المرفق');
    });
  });
}

/* قوالب الرسائل */
function tplSheet() {
  openSheet(`<div class="sh-top"><button data-close>إلغاء</button><b>قوالب الرسائل</b><button class="save" id="tp-save">حفظ</button></div>
    <p class="muted" style="font-size:13px">اضغط على أي خانة لإدراجها في مكان المؤشر. سطور القسط والموعد تُحذف تلقائياً لو ما فيه أقساط.</p>
    <div class="qchips">${PLACEHOLDERS.map(p => `<button class="qchip" data-ph="${p}">${p}</button>`).join('')}</div>
    <p class="sec-t">عندما تكون السلفية لك</p><textarea id="tp-in">${esc(S.settings.tplIn)}</textarea>
    <p class="sec-t">عندما تكون السلفية عليك</p><textarea id="tp-out">${esc(S.settings.tplOut)}</textarea>
    <button class="btn ghost" id="tp-reset" style="height:46px">استعادة القوالب الأصلية</button>`, sh => {
    let last = $('#tp-in', sh);
    sh.querySelectorAll('textarea').forEach(t => t.addEventListener('focus', () => { last = t; }));
    sh.querySelectorAll('[data-ph]').forEach(b => b.onmousedown = e => e.preventDefault());
    sh.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => {
      const t = last, s = t.selectionStart ?? t.value.length, e = t.selectionEnd ?? s;
      t.value = t.value.slice(0, s) + b.dataset.ph + t.value.slice(e); t.focus(); t.selectionStart = t.selectionEnd = s + b.dataset.ph.length;
    });
    $('#tp-reset', sh).onclick = () => { $('#tp-in', sh).value = TPL_IN; $('#tp-out', sh).value = TPL_OUT; };
    $('#tp-save', sh).onclick = () => {
      S.settings.tplIn = $('#tp-in', sh).value.trim() || TPL_IN; S.settings.tplOut = $('#tp-out', sh).value.trim() || TPL_OUT;
      save(); closeSheet(); if (share) { const d = getDebt(share.id); if (d) { share.msg = fillTpl(d, calc(d)); render(); } } toast('تم حفظ القوالب');
    };
  });
}

/* ---------- القفل ---------- */
async function hashPin(pin) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('amanah:' + pin));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch (e) { let h = 0; for (const ch of 'amanah:' + pin) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'x' + h; }
}
function padHTML(extra) {
  const k = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return `<div class="pad">${k.map(n => `<button data-n="${n}">${n}</button>`).join('')}${extra || '<span></span>'}<button data-n="0">0</button><button data-n="del" aria-label="حذف رقم">${IC.del}</button></div>`;
}
function pinInput(root, onDone) {
  let v = '';
  const dots = $('.dots', root);
  const draw = () => dots.innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < v.length ? 'f' : ''}"></i>`).join('');
  draw();
  root.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    const n = b.dataset.n;
    if (n === 'del') v = v.slice(0, -1); else if (v.length < 4) v += n;
    draw();
    if (v.length === 4) { const val = v; setTimeout(() => { onDone(val, () => { v = ''; dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake'); draw(); }); }, 120); }
  });
}
function pinSetup() {
  let first = null;
  openSheet(`<div class="sh-top"><button data-close>إلغاء</button><b id="pn-t">اختر رمزاً من 4 أرقام</b><span style="width:40px"></span></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:10px 0"><div class="dots"></div>${padHTML()}</div>`, sh => {
    pinInput(sh, async (val, fail) => {
      if (!first) { first = val; $('#pn-t', sh).textContent = 'أعد كتابة الرمز للتأكيد'; fail(); $('.dots', sh).classList.remove('shake'); return; }
      if (val !== first) { first = null; $('#pn-t', sh).textContent = 'الرمزان غير متطابقين، ابدأ من جديد'; fail(); return; }
      S.settings.pinHash = await hashPin(val); save(); closeSheet(); render(); toast('تم تفعيل القفل');
    });
  });
}
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
async function enableFaceId() {
  if (isNative) {
    await nativeReady;
    const NB = NP('NativeBiometric');
    try {
      const a = NB ? await NB.isAvailable() : null;
      if (!a || !a.isAvailable) { render(); return toast('Face ID غير مفعّل على هذا الجهاز'); }
      await NB.verifyIdentity({ reason: 'لتفعيل فتح أمانة ببصمة الوجه', title: 'أمانة' });
      S.settings.faceId = 'native'; save(); render(); toast('تم تفعيل Face ID');
    } catch (e) { render(); toast('لم يتم التفعيل'); }
    return;
  }
  try {
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: rnd(32), rp: { name: 'أمانة' },
      user: { id: rnd(16), name: 'amanah', displayName: 'أمانة' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000, attestation: 'none' } });
    S.settings.faceId = b64(cred.rawId); save(); render(); toast('تم تفعيل Face ID');
  } catch (e) { render(); toast('لم يتم تفعيل Face ID على هذا الجهاز'); }
}
async function faceUnlock() {
  if (S.settings.faceId === 'native') {
    await nativeReady;
    try { await NP('NativeBiometric').verifyIdentity({ reason: 'لفتح أمانة', title: 'أمانة' }); unlock(); }
    catch (e) { toast('تعذّر التحقق، استخدم الرمز'); }
    return;
  }
  try {
    await navigator.credentials.get({ publicKey: { challenge: rnd(32), allowCredentials: [{ type: 'public-key', id: unb64(S.settings.faceId) }], userVerification: 'required', timeout: 60000 } });
    unlock();
  } catch (e) { toast('تعذّر التحقق، استخدم الرمز'); }
}
function showLock() {
  if ($('#lock')) return;
  locked = true;
  const face = S.settings.faceId && (S.settings.faceId === 'native' ? isNative : !!window.PublicKeyCredential);
  const w = document.createElement('div'); w.className = 'lock'; w.id = 'lock';
  w.innerHTML = `<img src="icons/icon-180.png" alt=""><b style="font-size:20px">أمانة مقفلة</b><span class="muted">أدخل رمز القفل</span><div class="dots"></div>
    ${padHTML(face ? `<button data-face aria-label="فتح بـ Face ID">${IC.face}</button>` : '')}`;
  document.body.appendChild(w);
  pinInput(w, async (val, fail) => { if (await hashPin(val) === S.settings.pinHash) unlock(); else fail(); });
  const fb = $('[data-face]', w); if (fb) fb.onclick = faceUnlock;
  if (face && S.settings.faceId === 'native') setTimeout(faceUnlock, 350);
}
const afterUnlock = [];
function runWhenUnlocked(fn) { if (!locked) fn(); else afterUnlock.push(fn); }
function unlock() { locked = false; const w = $('#lock'); if (w) w.remove(); while (afterUnlock.length) { try { afterUnlock.shift()(); } catch (e) {} } }
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else {
    if (S.settings.pinHash && hiddenAt && Date.now() - hiddenAt > 60000) showLock();
    if (isNative) { clearDelivered(); scheduleNotis(); if (!curSheet && view.name === 'home' && !locked) render(); }
  }
});

/* ---------- النسخة الاحتياطية ---------- */
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function exportBackup() {
  toast('جارٍ تجهيز النسخة…');
  const files = {};
  for (const d of S.debts) for (const a of d.attachments || []) {
    try { const b = await fget(a.id); if (b) files[a.id] = await blobToDataURL(b); } catch (e) {}
  }
  const { pinHash, faceId, ...settings } = S.settings;
  const data = { app: 'amanah', format: 1, version: VERSION, exportedAt: new Date().toISOString(), debts: S.debts, settings, files };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  shareFile(blob, `amanah-backup-${iso(today())}.json`);
}
function importBackup() {
  const inp = $('#backuppick'); inp.value = '';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { return toast('الملف ليس نسخة احتياطية صالحة'); }
    if (!data || data.app !== 'amanah' || !Array.isArray(data.debts)) return toast('هذا الملف ليس نسخة من أمانة');
    confirmSheet({ title: 'استيراد النسخة الاحتياطية؟', text: `سيتم استبدال بياناتك الحالية (${S.debts.length} سلفيات) ببيانات النسخة (${data.debts.length} سلفيات).`, ok: 'استيراد', danger: true }, async () => {
      for (const [id, url] of Object.entries(data.files || {})) {
        try { const b = await (await fetch(url)).blob(); await fput(id, b); } catch (e) {}
      }
      S.debts = data.debts;
      const keep = { pinHash: S.settings.pinHash, faceId: S.settings.faceId };
      S.settings = { ...structuredClone(DEF_SETTINGS), ...(data.settings || {}), ...keep,
        share: { brand: data.settings?.share?.brand ?? true, show: { ...DEF_SETTINGS.share.show, ...(data.settings?.share?.show || {}) } } };
      save(); go({ name: 'home' }); toast('تم الاستيراد');
    });
  };
  inp.click();
}

/* ---------- أمثلة توضيحية ---------- */
function addDemo() {
  const t = today(), y = t.getFullYear(), m = t.getMonth();
  const mk = (o) => ({ id: rid(), payments: [], attachments: [], createdAt: Date.now(), updatedAt: Date.now(), demo: true, note: '', ...o });
  const salem = mk({ dir: 'in', name: 'سالم الحارثي', phone: '99123456', total: 1500, monthly: 150, start: iso(new Date(y, m - 4, 10)), dueDay: 10, color: 'teal' });
  for (let k = 0; k < 3; k++) salem.payments.push({ id: rid(), amount: 150, date: iso(dueDate(salem, k)), kind: 'installment', note: '' });
  const khalid = mk({ dir: 'out', name: 'خالد البلوشي', phone: '92345678', total: 800, monthly: 150, start: iso(new Date(y, m - 2, 25)), dueDay: 25, color: 'plum' });
  khalid.payments.push({ id: rid(), amount: 150, date: iso(dueDate(khalid, 0)), kind: 'installment', note: '' });
  const maryam = mk({ dir: 'in', name: 'مريم السيابي', phone: '', total: 250, monthly: 50, start: iso(new Date(y, m, 1)), dueDay: 1, color: 'ochre' });
  maryam.payments.push({ id: rid(), amount: 50, date: iso(t), kind: 'partial', note: 'دفعة مبكرة' });
  const nasser = mk({ dir: 'out', name: 'ناصر الكلباني', phone: '', total: 90, monthly: 0, start: iso(new Date(y, m, Math.max(1, t.getDate() - 10))), dueDay: 1, color: 'white' });
  S.debts.push(salem, khalid, maryam, nasser);
  save(); frontId = null; render();
}

/* ---------- التوست ---------- */
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200); }

/* ---------- العرض ---------- */
function render() {
  applyMode();
  const app = $('#app');
  let h;
  if (view.name === 'detail') h = vDetail();
  else if (view.name === 'share') h = vShare();
  else if (view.name === 'settings') h = vSettings();
  else h = vHome();
  app.innerHTML = h;
  if (view.name === 'share' && $('#shfields')) bindShare();
  if (view.name === 'settings' && $('#st-name')) bindSettings();
  app.querySelectorAll('img[data-fid]').forEach(async img => { const u = await fileURL(img.dataset.fid); if (u) img.src = u; });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t || locked) return;
  const a = t.dataset.a, id = t.dataset.id;
  switch (a) {
    case 'home': go({ name: 'home' }); break;
    case 'settings': go({ name: 'settings' }); break;
    case 'add': formSheet(); break;
    case 'edit': formSheet(id); break;
    case 'open': share = null; go({ name: 'detail', id }); break;
    case 'front': frontId = id; render(); break;
    case 'filter': filter = t.dataset.f; frontId = null; render(); break;
    case 'mode': S.settings.mode = { auto: 'light', light: 'dark', dark: 'auto' }[S.settings.mode] || 'auto'; save(); render(); toast('المظهر: ' + modeName(S.settings.mode)); break;
    case 'paymonth': payMonth(id); break;
    case 'pay': paySheet(id); break;
    case 'delpay': {
      const d = getDebt(id);
      confirmSheet({ title: 'حذف هذه الدفعة؟', text: 'سيُعاد حساب المتبقي تلقائياً.', ok: 'حذف الدفعة', danger: true }, () => {
        d.payments = d.payments.filter(p => p.id !== t.dataset.p);
        (d.attachments || []).forEach(x => { if (x.payId === t.dataset.p) x.payId = null; });
        save(); render(); toast('تم حذف الدفعة');
      });
      break;
    }
    case 'deldebt': {
      const d = getDebt(id);
      confirmSheet({ title: `حذف سلفية ${esc(d.name)}؟`, text: 'سيتم حذف الدفعات والمرفقات نهائياً.', ok: 'حذف نهائياً', danger: true }, async () => {
        for (const x of d.attachments || []) { try { await fdel(x.id); } catch (er) {} }
        S.debts = S.debts.filter(x => x.id !== id); save(); go({ name: 'home' }); toast('تم الحذف');
      });
      break;
    }
    case 'addatt': attKindSheet(id); break;
    case 'viewatt': viewAtt(id, t.dataset.att); break;
    case 'share': share = null; go({ name: 'share', id }); break;
    case 'shareimg': (async () => { const d = getDebt(share.id); const b = await cardBlob(d, 'png'); if (b) shareFile(b, `كشف-${d.name}.png`, share.msg); })(); break;
    case 'sharepdf': (async () => { const d = getDebt(share.id); const b = await cardBlob(d, 'pdf'); if (b) shareFile(b, `كشف-${d.name}.pdf`); })(); break;
    case 'msgreset': { const d = getDebt(share.id); share.msg = fillTpl(d, calc(d)); $('#sh-msg').value = share.msg; $('#wa-link').href = waLink(d, share.msg); break; }
    case 'msgcopy': (async () => { try { await navigator.clipboard.writeText(share.msg); toast('تم نسخ النص'); } catch (er) { toast('تعذّر النسخ، حدّد النص وانسخه يدوياً'); } })(); break;
    case 'tpl': tplSheet(); break;
    case 'set': { const k = t.dataset.k; S.settings[k] = k === 'remindDays' ? +t.dataset.v : t.dataset.v; save(); render(); break; }
    case 'pinchange': pinSetup(); break;
    case 'testnoti': testNotification(); break;
    case 'export': exportBackup(); break;
    case 'import': importBackup(); break;
    case 'wipe': confirmSheet({ title: 'حذف كل البيانات؟', text: 'لا يمكن التراجع. صدّر نسخة احتياطية أولاً إن أردت.', ok: 'حذف كل شيء', danger: true }, async () => {
      for (const d of S.debts) for (const x of d.attachments || []) { try { await fdel(x.id); } catch (er) {} }
      S.debts = []; save(); go({ name: 'home' }); toast('تم حذف البيانات');
    }); break;
    case 'demo': addDemo(); break;
    case 'cleardemo': S.debts = S.debts.filter(d => !d.demo); save(); frontId = null; render(); break;
  }
});

/* ---------- تنبيهات الجوال (نسخة الآيفون) ---------- */
async function ensureNotifyPermission() {
  await nativeReady; const LN = NP('LocalNotifications'); if (!LN) return false;
  try {
    let p = await LN.checkPermissions();
    if (p.display !== 'granted') p = await LN.requestPermissions();
    return p.display === 'granted';
  } catch (e) { return false; }
}
async function clearDelivered() {
  await nativeReady; const LN = NP('LocalNotifications');
  try { if (LN) await LN.removeAllDeliveredNotifications(); } catch (e) {}
}
function expectedBy(d, T) {
  const m = +d.monthly || 0; if (!m) return 0;
  const total = +d.total || 0, cycles = Math.ceil(total / m - 1e-9);
  let k = 0; while (k < cycles && dueDate(d, k) <= T) k++;
  return Math.min(total, m * k);
}
function buildNotis() {
  const now = new Date(), H = +S.settings.notifyHour || 9, out = [];
  const at = (base, add) => { const x = new Date(base); x.setDate(x.getDate() + add); x.setHours(H, 0, 0, 0); return x; };
  const money = v => fmt(v) + ' ر.ع';
  const rd = +S.settings.remindDays || 0;
  for (const d of S.debts) {
    const c = calc(d); if (c.settled || !(c.m > 0)) continue;
    const who = d.name;
    const late = v => d.dir === 'in' ? `لم تسجّل استلام قسط ${who} بعد · ${money(v)}` : `قسطك لـ${who} لم يُسدَّد بعد · ${money(v)}`;
    const dueToday = v => d.dir === 'in' ? `موعد استلام قسط ${who} اليوم · ${money(v)}` : `موعد تسديد قسطك لـ${who} اليوم · ${money(v)}`;
    const push = (t, title, body, level) => { if (t > now) out.push({ t, d, title, body, level }); };
    if (c.dueNow) {
      const todayDue = daysBetween(c.nextDate, today()) === 0;
      for (let i = 0; i < 7; i++) push(at(today(), i), i === 0 && todayDue ? 'قسط مستحق اليوم' : 'قسط متأخر', i === 0 && todayDue ? dueToday(c.behind) : late(c.behind), 'timeSensitive');
    }
    const start = c.dueNow ? c.elapsed : c.k0;
    for (let k = start; k < Math.min(c.cycles, start + 3); k++) {
      const due = dueDate(d, k), amt = Math.min(c.m, r3(c.total - c.m * k));
      if (rd > 0) push(at(due, -rd), 'تذكير بقسط قادم', `${d.dir === 'in' ? 'قسط ' + who : 'قسطك لـ' + who} ${rd === 1 ? 'غداً' : 'بعد ' + daysAr(rd)} · ${money(amt)}`, 'active');
      push(at(due, 0), 'قسط مستحق اليوم', dueToday(amt), 'timeSensitive');
      for (let i = 1; i <= 3; i++) push(at(due, i), 'قسط متأخر', late(amt), 'timeSensitive');
    }
  }
  out.sort((a, b) => a.t - b.t);
  return out.slice(0, 60).map((n, i) => {
    const badge = S.debts.filter(x => { const cc = calc(x); return !cc.settled && expectedBy(x, n.t) - cc.paid > 0.0005; }).length;
    return { id: i + 1, title: n.title, body: n.body, schedule: { at: n.t, allowWhileIdle: true }, sound: 'amanah.wav',
      interruptionLevel: n.level, actionTypeId: 'DUE', extra: { debtId: n.d.id }, badge: Math.max(1, badge) };
  });
}
let notiBusy = Promise.resolve();
function scheduleNotis() {
  if (!isNative) return Promise.resolve();
  notiBusy = notiBusy.then(async () => {
    await nativeReady; const LN = NP('LocalNotifications'); if (!LN) return;
    try {
      const pend = await LN.getPending();
      const old = (pend && pend.notifications || []).filter(n => n.id !== 999);
      if (old.length) await LN.cancel({ notifications: old.map(n => ({ id: n.id })) });
      if (!S.settings.notify) return;
      const p = await LN.checkPermissions(); if (p.display !== 'granted') return;
      const items = buildNotis(); if (items.length) await LN.schedule({ notifications: items });
    } catch (e) { console.warn('notifications', e); }
  });
  return notiBusy;
}
async function testNotification() {
  const ok = await ensureNotifyPermission();
  if (!ok) return toast('اسمح بالتنبيهات من إعدادات الآيفون ← أمانة');
  try {
    await NP('LocalNotifications').schedule({ notifications: [{ id: 999, title: 'أمانة', body: 'تنبيه تجريبي: التنبيهات تعمل ✓', schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, sound: 'amanah.wav', interruptionLevel: 'timeSensitive' }] });
    toast('سيصلك تنبيه بعد 5 ثوانٍ');
  } catch (e) { toast('تعذّر جدولة التنبيه'); }
}
function askNotifySheet() {
  openSheet(`<div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:8px 0">
      <img src="icons/icon-180.png" alt="" style="width:64px;height:64px;border-radius:16px">
      <b style="font-size:18px">فعّل تنبيهات الأقساط</b>
      <p class="muted" style="max-width:30ch">يذكّرك أمانة قبل موعد القسط وفي يومه، ويستمر يومياً حتى تسجّل التسديد، حتى لو كان التطبيق مغلقاً.</p>
    </div>
    <button class="btn" id="an-yes">السماح بالتنبيهات</button>
    <button class="btn ghost" data-close style="height:48px">ليس الآن</button>`, sh => {
    $('#an-yes', sh).onclick = async () => { closeSheet(); const ok = await ensureNotifyPermission(); toast(ok ? 'تم تفعيل التنبيهات' : 'لم يتم السماح بالتنبيهات'); scheduleNotis(); };
  });
}
async function nativeInit() {
  await nativeReady;
  if (await nativeRestore()) { render(); if (S.settings.pinHash && !locked) showLock(); }
  const LN = NP('LocalNotifications');
  if (LN) {
    try { await LN.registerActionTypes({ types: [{ id: 'DUE', actions: [{ id: 'paid', title: 'تم التسديد ✓', foreground: true }] }] }); } catch (e) {}
    try {
      LN.addListener('localNotificationActionPerformed', ev => {
        const id = ev && ev.notification && ev.notification.extra && ev.notification.extra.debtId;
        if (!id || !getDebt(id)) return;
        runWhenUnlocked(() => { closeSheet(true); go({ name: 'detail', id }); if (ev.actionId === 'paid') payMonth(id); });
      });
    } catch (e) {}
    clearDelivered();
    if (S.settings.notify && S.debts.some(d => +d.monthly > 0)) {
      try { const p = await LN.checkPermissions(); if (p.display === 'prompt' || p.display === 'prompt-with-rationale') runWhenUnlocked(askNotifySheet); } catch (e) {}
    }
  }
  scheduleNotis();
}

/* ---------- البدء ---------- */
load();
render();
if (S.settings.pinHash) showLock();
if (isNative) { document.documentElement.classList.add('native'); nativeInit(); }
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
// تحديث التنبيهات عند تغيّر اليوم
setInterval(() => { if (!curSheet && view.name === 'home' && !locked) render(); }, 30 * 60 * 1000);
