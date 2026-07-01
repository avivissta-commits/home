import { useState, useLayoutEffect, useEffect, useRef, useMemo } from "react";

/* ------------------------------------------------------------------ *
 *  רשימת קניות — Apple-inspired Liquid Glass
 *  Mobile-first · RTL · React 19 + Tailwind 4
 *
 *  כלול:
 *   - כרטיסיות קומפקטיות בסגנון glass (פריסה אופקית, גובה נמוך)
 *   - סטטיסטיקה קומפקטית בצד שמאל למעלה
 *   - חיפוש + כפתור סינון באותה שורה
 *   - סינון כ-bottom sheet
 *   - צמצום אוטומטי של פריטים שהושלמו (5+ -> כרטיס מסכם נפתח)
 *   - אנימציות layout/reorder/enter/exit ללא תלות חיצונית (FLIP)
 *
 *  להחלפה ב-Framer Motion: ראה הערה בתחתית הקובץ.
 * ------------------------------------------------------------------ */

/* ----------------------------- נתונים ----------------------------- */

const PRIORITY = {
  high: { label: "דחוף", dot: "#ef4444", text: "#b42318", bg: "rgba(255, 99, 99, 0.16)", border: "rgba(239,68,68,0.35)", rank: 0 },
  medium: { label: "חשוב", dot: "#f59e0b", text: "#b45309", bg: "rgba(245, 175, 64, 0.18)", border: "rgba(245,158,11,0.35)", rank: 1 },
  low: { label: "רגיל", dot: "#22c55e", text: "#15803d", bg: "rgba(74, 200, 120, 0.16)", border: "rgba(34,197,94,0.30)", rank: 2 },
};

const seedItems = [
  {"name": "כיבוס שמיכות סלון", "emoji": "🛋️", "category": "ניקיון", "type": "קבועים", "priority": "low", "note": "", "who": "אביב", "id": "n1782054394930", "kind": "task", "status": "active", "updated": "21.06.26"},
  {"name": "להשקות עציצים", "emoji": "🪴", "category": "כללי", "type": "קבועים", "priority": "high", "note": "", "who": "אביב", "id": "n1782054361984", "kind": "task", "status": "active", "updated": "21.06.26"},
  {"name": "ריחן זלנסקי", "emoji": "🕯️", "category": "בית", "type": "משתנים", "priority": "low", "note": "", "who": null, "id": "n1782054336141", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "אקונומיקה שפריץ", "emoji": "🧻", "category": "ניקיון", "type": "קבועים", "priority": "low", "note": "", "who": null, "id": "n1782054321273", "kind": "shopping", "status": "done", "updated": "21.06.26"},
  {"name": "הזמנה משיין עלי (מתלה מטאטא ועוד)", "emoji": "🛒", "category": "בית", "type": "משתנים", "priority": "low", "note": "", "who": null, "id": "n1782054307384", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "מוט בלנדר", "emoji": "🛒", "category": "אוכל", "type": "משתנים", "priority": "low", "note": "", "who": null, "id": "n1782054296487", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "תבלינים", "emoji": "🍚", "category": "אוכל", "type": "משתנים", "priority": "low", "note": "", "who": null, "id": "n1782054290247", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "חלקי חילוף mova", "emoji": "🔨", "category": "בית", "type": "משתנים", "priority": "medium", "note": "", "who": null, "id": "n1782054275403", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "מוט כושר (מתח)", "emoji": "🛒", "category": "בית", "type": "משתנים", "priority": "medium", "note": "", "who": null, "id": "n1782054262114", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "טונייט", "emoji": "💊", "category": "תרופות", "type": "משתנים", "priority": "high", "note": "", "who": null, "id": "n1782054250803", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "כביסכל", "emoji": "🧴", "category": "ניקיון", "type": "קבועים", "priority": "low", "note": "", "who": null, "id": "n1782054232083", "kind": "shopping", "status": "done", "updated": "21.06.26"},
  {"name": "שמן זית", "emoji": "🔋", "category": "אוכל", "type": "קבועים", "priority": "low", "note": "", "who": null, "id": "n1782054214570", "kind": "shopping", "status": "done", "updated": "21.06.26"},
  {"name": "ביצים", "emoji": "🍚", "category": "אוכל", "type": "קבועים", "priority": "low", "note": "", "who": null, "id": "n1782054205091", "kind": "shopping", "status": "done", "updated": "21.06.26"},
  {"name": "חומר רצפה mova", "emoji": "🧴", "category": "ניקיון", "type": "קבועים", "priority": "medium", "note": "", "who": null, "id": "n1782054185281", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "חוט דנטאלי", "emoji": "🪥", "category": "טיפוח", "type": "קבועים", "priority": "medium", "note": "", "who": null, "id": "n1782054172435", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"name": "קפה", "emoji": "☕", "category": "אוכל", "type": "קבועים", "priority": "low", "note": "", "who": null, "id": "n1782054144977", "kind": "shopping", "status": "active", "updated": "21.06.26"},
  {"kind": "shopping", "id": "i1", "name": "נייר סופג", "emoji": "🧻", "category": "ניקיון", "type": "קבועים", "priority": "high", "status": "active", "updated": "21.06.26", "note": "לקנות 2 חבילות גדולות, רק מהמותג הירוק"},
  {"kind": "shopping", "id": "i2", "name": "חבילת טישו", "emoji": "🧻", "category": "ניקיון", "type": "קבועים", "priority": "medium", "status": "active", "updated": "21.06.26"},
  {"kind": "shopping", "id": "i3", "name": "קשים מתכת", "emoji": "🛒", "category": "בית", "type": "משתנים", "priority": "low", "status": "active", "updated": "21.06.26"},
  {"kind": "shopping", "id": "i4", "name": "דלי מגבונים", "emoji": "🧽", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "active", "updated": "21.06.26"},
  {"kind": "shopping", "id": "i5", "name": "סבון כלים", "emoji": "🧴", "category": "ניקיון", "type": "קבועים", "priority": "medium", "status": "active", "updated": "20.06.26"},
  {"kind": "shopping", "id": "b1", "name": "נייר טואלט", "emoji": "🧻", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "19.06.26"},
  {"kind": "shopping", "id": "b2", "name": "מרכך כביסה", "emoji": "🧴", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "19.06.26"},
  {"kind": "shopping", "id": "b3", "name": "אבקת כביסה", "emoji": "🧺", "category": "ניקיון", "type": "קבועים", "priority": "medium", "status": "done", "updated": "18.06.26"},
  {"kind": "shopping", "id": "b4", "name": "ספוגות", "emoji": "🧽", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "18.06.26"},
  {"kind": "shopping", "id": "b5", "name": "מטליות", "emoji": "🧻", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "17.06.26"},
  {"kind": "shopping", "id": "b6", "name": "שקיות זבל", "emoji": "🗑️", "category": "בית", "type": "קבועים", "priority": "low", "status": "done", "updated": "17.06.26"},
  {"kind": "shopping", "id": "v1", "name": "אקמול", "emoji": "💊", "category": "תרופות", "type": "משתנים", "priority": "high", "status": "active", "updated": "21.06.26"},
  {"kind": "task", "id": "t1", "name": "כביסה", "emoji": "🧺", "category": "כביסה", "type": "קבועים", "priority": "high", "status": "active", "updated": "21.06.26", "who": "אביב", "note": "המכונה כבר מלאה"},
  {"kind": "task", "id": "t3", "name": "שטיפת כלים", "emoji": "🧽", "category": "ניקיון", "type": "קבועים", "priority": "high", "status": "active", "updated": "21.06.26", "who": "אביב"},
  {"kind": "task", "id": "t4", "name": "ניקיון שירותים", "emoji": "🚿", "category": "ניקיון", "type": "קבועים", "priority": "medium", "status": "active", "updated": "21.06.26", "who": "יוסי"},
  {"kind": "task", "id": "t5", "name": "קיזוז חשבונות", "emoji": "🧾", "category": "חשבונות", "type": "קבועים", "priority": "medium", "status": "active", "updated": "21.06.26", "who": "כולם", "note": "עד ה-25 לחודש"},
  {"kind": "task", "id": "td1", "name": "ניגוב אבק", "emoji": "🧹", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "19.06.26", "who": "אביב"},
  {"kind": "task", "id": "td2", "name": "הוצאת זבל", "emoji": "🗑️", "category": "ניקיון", "type": "קבועים", "priority": "low", "status": "done", "updated": "19.06.26", "who": "יוסי"},
  {"kind": "task", "id": "t2", "name": "קיפול בגדים", "emoji": "👕", "category": "סידור", "type": "קבועים", "priority": "medium", "status": "active", "updated": "21.06.26", "who": "יוסי"},
  {"kind": "task", "id": "t7", "name": "סידור ארון קיץ", "emoji": "📦", "category": "סידור", "type": "משתנים", "priority": "high", "status": "active", "updated": "21.06.26", "who": "אביב"},
];

/* ---- שמירה מקומית (localStorage) — עטוף בהגנה כדי לא להפיל שום סביבה ---- */
const STORAGE_KEY = "habayit_items_v1";

/* כתובת הסנכרון המשותף — Cloudflare Worker (מוגדרת ב-index.html דרך window.HABAYIT_SYNC_URL).
   ה-Worker מטפל ב-CORS ושומר ב-KV. אם ריק/לא זמין — נפילה חזרה ל-localStorage. */
const SYNC_URL =
  (typeof window !== "undefined" && window.HABAYIT_SYNC_URL) || "";

function loadItems() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return seedItems;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedItems;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedItems;
  } catch {
    return seedItems;
  }
}

function saveItems(items) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    /* מצב פרטי / סביבה ללא אחסון — פשוט לא שומרים */
  }
}

const SHOPPING_CATEGORIES = ["ניקיון", "אוכל", "כללי", "בית", "טיפוח"];
const TASK_CATEGORIES = ["ניקיון", "סידור", "כביסה", "חשבונות", "כללי"];
const TYPES = ["קבועים", "משתנים"];
const ASSIGNEES = ["אביב", "יוסי", "כולם"];
const WHO_COLORS = { "אביב": "#2f8f73", "יוסי": "#4f6bd0", "כולם": "#7a7f8c" };

// תאריך נוכחי בפורמט DD.MM.YY — לשדה "עודכן" בכל פעולה
const _p2 = (n) => String(n).padStart(2, "0");
function nowStamp() {
  const d = new Date();
  return `${_p2(d.getDate())}.${_p2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(-2)}`;
}

// אוסף אייקונים — 5 מכל קטגוריה, כל חמישייה מכסה כמה שיותר סוגים שונים
const SHOPPING_EMOJIS = [
  { label: "ניקיון", items: ["🧽", "🧹", "🧻", "🧼", "🧴"] },
  { label: "אוכל", items: ["🛒", "🥤", "🍲", "🧂", "🥫"] },
  { label: "כללי", items: ["🛍️", "💊", "👕", "🔋", "🧩"] },
  { label: "בית", items: ["🛋️", "📦", "🪴", "🔨", "🕯️"] },
  { label: "טיפוח", items: ["🧴", "🪥", "🪒", "🧼", "🚿"] },
];

// אייקונים לעולם המטלות — 5 מכל קטגוריה
const TASK_EMOJIS = [
  { label: "ניקיון", items: ["🧽", "🧹", "🚿", "🪣", "🧴"] },
  { label: "כביסה", items: ["🧺", "👕", "🧦", "👖", "🧼"] },
  { label: "סידור", items: ["🛋️", "🛏️", "📦", "🗂️", "👔"] },
  { label: "חשבונות", items: ["🧾", "💳", "💰", "📅", "🏦"] },
  { label: "כללי", items: ["✅", "🔧", "🪴", "🐾", "✏️"] },
];

// תצורת כל טאב — מה שמשתנה בין קניות למשימות
const TABS = [
  {
    key: "shopping", label: "קניות", icon: "🛒", word: "פריט",
    kicker: "רשימת קניות", title: "הבית צריך",
    categories: SHOPPING_CATEGORIES, emojiGroups: SHOPPING_EMOJIS,
    statusActive: "לקנייה", statusDone: "נקנו", assignees: null,
    defaultEmoji: "🛒", defaultCategory: "אוכל",
  },
  {
    key: "task", label: "משימות", icon: "🧺", word: "משימה",
    kicker: "מטלות הבית", title: "מה לעשות",
    categories: TASK_CATEGORIES, emojiGroups: TASK_EMOJIS,
    statusActive: "לביצוע", statusDone: "בוצע", assignees: ASSIGNEES,
    defaultEmoji: "✅", defaultCategory: "ניקיון",
  },
];

// אייקוני קטגוריה: מחזיר את חמשת האייקונים של הקטגוריה הנבחרת (הראשון = הימני ביותר)
function iconsFor(cfg, category) {
  const g = cfg.emojiGroups.find((x) => x.label === category);
  return g ? g.items : (cfg.emojiGroups[0] ? cfg.emojiGroups[0].items : []);
}
// לפרודקשן: שמור את background.jpg תחת public/ והחלף את BG_URL ל-"/background.jpg".
// כאן מוטמעת גרסה דחוסה כדי שהתצוגה תרנדר את הרקע האמיתי.
const BG_URL = "data:image/jpeg;base64,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";

/* --------------------------- FLIP hook ---------------------------- *
 * נותן ref-callback לכל פריט; בכל render שמשנה מיקום, הפריטים מחליקים
 * למקום החדש שלהם (reorder), נכנסים ב-fade+slide, ומחליפים מקום בחלקות.
 * ----------------------------------------------------------------- */
function useFlip(suppressRef) {
  const nodes = useRef(new Map());
  const prev = useRef(new Map());

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const register = (id) => (node) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  };

  useLayoutEffect(() => {
    if (reduce) return;
    // בזמן פתיחה/סגירה של קבוצה — מדוד ועדכן מיקומים בלי אנימציית FLIP,
    // כדי שלא ייווצר "קפיצה" כשהקבוצה השנייה זזה בעקבות שינוי הגובה.
    const suppressed = suppressRef && suppressRef.current && Date.now() < suppressRef.current;
    const els = nodes.current;
    const next = new Map();

    // pass 1 — נטרל טרנספורם קיים ומדוד מיקום טבעי (Last)
    els.forEach((node, id) => {
      node.style.transition = "none";
      node.style.transform = "none";
      next.set(id, node.getBoundingClientRect());
    });

    // pass 2 — Invert + Play
    if (!suppressed) {
      els.forEach((node, id) => {
        const oldRect = prev.current.get(id);
        const newRect = next.get(id);
        if (oldRect) {
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;
          if (dx || dy) {
            node.style.transform = `translate(${dx}px, ${dy}px)`;
            node.getBoundingClientRect(); // force reflow
            node.style.transition = "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";
            node.style.transform = "none";
          }
        }
        // כניסה מטופלת ע"י אנימציית ה-stagger הפנימית (cardStagger), לא כאן
      });
    }

    prev.current = next;
  });

  return register;
}

/* ---------------------------- רכיבים ------------------------------ */

const glass = (extra = {}) => ({
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(18px) saturate(160%)",
  WebkitBackdropFilter: "blur(18px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 6px 22px -10px rgba(60,90,75,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
  ...extra,
});

/* רקע הכרטיס לפי חשיבות — שכבת צבע עדינה מעל glass, נשמרת שקיפות/blur */
function cardStyle(priority, bought) {
  if (bought) return glass({ background: "rgba(255,255,255,0.34)" });
  if (priority === "high")
    return glass({
      background:
        "linear-gradient(0deg, rgba(255,80,80,0.13), rgba(255,80,80,0.13)), rgba(255,255,255,0.5)",
      border: "1px solid rgba(239,68,68,0.42)",
      boxShadow: "0 8px 24px -12px rgba(210,60,60,0.35), inset 0 1px 0 rgba(255,255,255,0.55)",
    });
  if (priority === "medium")
    return glass({
      background:
        "linear-gradient(0deg, rgba(245,160,40,0.14), rgba(245,160,40,0.14)), rgba(255,255,255,0.5)",
      border: "1px solid rgba(245,158,11,0.42)",
      boxShadow: "0 8px 24px -12px rgba(210,150,40,0.32), inset 0 1px 0 rgba(255,255,255,0.55)",
    });
  return glass({ background: "rgba(255,255,255,0.55)" }); // רגיל
}

/* תגית אחידה — משמשת גם לחשיבות וגם לשיוך (אותו גובה/פונט/padding/radius/רוחב) */
function Badge({ dot, label, bg, text, border }) {
  return (
    <span
      className="inline-flex items-center justify-center gap-1 rounded-full whitespace-nowrap"
      style={{
        height: 20, minWidth: 62, paddingInline: 8,
        fontSize: 10, fontWeight: 600, lineHeight: 1,
        background: bg, color: text, border: `1px solid ${border}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, boxShadow: `0 0 5px ${dot}`, flexShrink: 0 }} />
      <span>{label}</span>
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority];
  return <Badge dot={p.dot} label={p.label} bg={p.bg} text={p.text} border={p.border} />;
}

/* תג שיוך — אותו קומפוננט Badge, נקודה צבעונית לפי המשתמש */
function AssigneeChip({ who }) {
  const color = WHO_COLORS[who] || "#6b7280";
  return <Badge dot={color} label={who} bg={`${color}20`} text={color} border={`${color}66`} />;
}

function StatCard({ value, label, tint }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 min-w-[58px]"
      style={glass({ background: "rgba(255,255,255,0.5)" })}
    >
      <span className="text-lg font-bold leading-none" style={{ color: tint }}>{value}</span>
      <span className="text-[10px] text-stone-500 mt-0.5">{label}</span>
    </div>
  );
}

function Checkbox({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={checked ? "בטל סימון" : "סמן כנקנה"}
      className="shrink-0 grid place-items-center rounded-xl transition-transform active:scale-90"
      style={{
        width: 34, height: 34,
        background: checked ? "rgba(74,180,120,0.9)" : "rgba(255,255,255,0.5)",
        border: `1.5px solid ${checked ? "rgba(74,180,120,0.9)" : "rgba(120,150,135,0.4)"}`,
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {checked && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}

/* כפתור התקדמות תת-משימות — אותה שפה עיצובית כמו כפתור ה-V */
function ProgressButton({ done, total, open, onClick }) {
  const complete = done >= total;
  return (
    <button
      onClick={onClick}
      aria-label="תת-משימות"
      className="shrink-0 grid place-items-center rounded-xl transition-transform active:scale-90"
      style={{
        width: 34, height: 34,
        background: open ? "rgba(74,180,120,0.16)" : "rgba(255,255,255,0.5)",
        border: `1.5px solid ${open || complete ? "rgba(74,180,120,0.7)" : "rgba(120,150,135,0.4)"}`,
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        color: open || complete ? "#2f8f5f" : "#5c6f64",
        fontWeight: 700, fontSize: 11, lineHeight: 1,
      }}
    >
      {done}/{total}
    </button>
  );
}

/* צ'ק קטן לתת-פריטים */
function MiniCheck({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 grid place-items-center rounded-lg transition-transform active:scale-90"
      style={{
        width: 24, height: 24,
        background: checked ? "rgba(74,180,120,0.9)" : "rgba(255,255,255,0.55)",
        border: `1.5px solid ${checked ? "rgba(74,180,120,0.9)" : "rgba(120,150,135,0.45)"}`,
      }}
      aria-label={checked ? "בטל" : "סמן"}
    >
      {checked && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}

/* כרטיס פריט קומפקטי — פריסה אופקית, גובה נמוך */
function ItemCard({ item, registerRef, onToggle, onEdit, onToggleSub, removing, enterIndex = 0, enterToken, completing = false, closing = false, count = 0 }) {
  const bought = item.status === "done";
  const isDeleting = completing === "delete";
  const doneLook = bought || !!completing; // מראה מעומעם בזמן מחווה
  const strike = bought || completing === "done"; // קו חוצה + V רק להשלמה
  const comp = completing
    ? (isDeleting
        ? { stroke: "#FF3B30", fill: "rgba(255,59,48,0.13)", glow: "drop-shadow(0 0 3px rgba(255,59,48,0.75)) drop-shadow(0 0 6px rgba(255,59,48,0.35))" }
        : { stroke: "#34C759", fill: "rgba(52,199,89,0.13)", glow: "drop-shadow(0 0 3px rgba(52,199,89,0.75)) drop-shadow(0 0 6px rgba(52,199,89,0.35))" })
    : null;
  const subs = item.subs || [];
  const hasSubs = subs.length > 0;
  const doneCount = subs.filter((s) => s.done).length;
  const [open, setOpen] = useState(false);
  return (
    <div
      ref={registerRef}
      style={{
        maxHeight: removing ? 0 : 600,
        opacity: removing ? 0 : 1,
        marginBottom: removing ? 0 : 8,
        transform: removing ? "scale(0.96)" : "none",
        transition: "max-height 260ms ease, opacity 220ms ease, margin 260ms ease, transform 220ms ease",
        overflow: "hidden",
      }}
    >
      <div
        key={String(enterToken)}
        style={{
          animation: closing
            ? "cardExit 320ms cubic-bezier(0.4,0,1,1) forwards"
            : "cardStagger 460ms cubic-bezier(0.22,1,0.36,1) both",
          animationDelay: closing
            ? `${Math.min(Math.max(count - 1 - enterIndex, 0), 6) * 45}ms`
            : `${Math.min(enterIndex, 12) * 85}ms`,
        }}
      >
      <div
        onClick={() => onEdit(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(item)}
        className="relative overflow-hidden flex items-center gap-2.5 rounded-2xl px-2.5 py-2 cursor-pointer transition-transform active:scale-[0.99]"
        style={cardStyle(item.priority, bought)}
      >
        {/* מחווה — מסגרת + מילוי על כל הכרטיס (ירוק=השלמה, אדום=מחיקה) */}
        {comp && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "inherit",
                background: comp.fill,
                opacity: 0,
                animation: "fillFade 220ms ease 400ms forwards",
                zIndex: 1,
              }}
            />
            <svg
              className="pointer-events-none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", zIndex: 3 }}
            >
              <rect
                fill="none" stroke={comp.stroke} strokeWidth="1.1" strokeLinecap="round" pathLength="1"
                style={{
                  x: "1.5px", y: "1.5px",
                  width: "calc(100% - 3px)", height: "calc(100% - 3px)",
                  rx: "15px", ry: "15px",
                  strokeDasharray: 1, strokeDashoffset: 1,
                  animation: "drawBorder 430ms ease forwards",
                  filter: comp.glow,
                }}
              />
            </svg>
          </>
        )}

        {/* ימין: אייקון הפריט */}
        <div
          className="shrink-0 grid place-items-center rounded-xl"
          style={{ width: 56, height: 56, fontSize: 34, lineHeight: 1, position: "relative", zIndex: 2, opacity: doneLook ? 0.5 : 1, transition: "opacity 260ms ease", ...glass({ background: "rgba(255,255,255,0.45)" }) }}
        >
          {item.emoji}
        </div>

        {/* אמצע: שם / מטא / עודכן */}
        <div className="flex-1 min-w-0 text-right" style={{ position: "relative", zIndex: 2 }}>
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold text-[17px] leading-tight truncate"
              style={{ color: doneLook ? "#7b8a82" : "#2b3a33", textDecoration: strike ? "line-through" : "none", transition: "color 260ms ease" }}
            >
              {item.name}
            </span>
            {item.note?.trim() && (
              <span title="יש הערה" className="shrink-0 text-[12px] opacity-70">📝</span>
            )}
          </div>

          {/* שורה 2: חשיבות • קטגוריה • שיוך */}
          <div className="flex items-center gap-1.5 mt-1 text-[14px] leading-none" style={{ color: "#6b7280" }}>
            {!bought && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <span style={{ width: 6, height: 6, borderRadius: 999, background: PRIORITY[item.priority].dot, boxShadow: `0 0 5px ${PRIORITY[item.priority].dot}` }} />
                <span style={{ color: PRIORITY[item.priority].text }}>{PRIORITY[item.priority].label}</span>
              </span>
            )}
            {!bought && <span className="text-stone-300">·</span>}
            <span className="truncate">{item.category}</span>
            {item.who && <span className="text-stone-300 shrink-0">·</span>}
            {item.who && (
              <span className="inline-flex items-center gap-1 shrink-0" style={{ color: WHO_COLORS[item.who] }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: WHO_COLORS[item.who] }} />
                {item.who}
              </span>
            )}
          </div>

          {/* שורה 3: עודכן */}
          <div className="text-[12px] text-stone-400 mt-2 leading-none">עודכן {item.updated}</div>
        </div>

        {/* שמאל: שני כפתורים מרובעים באותו עיצוב — התקדמות + V */}
        <div className="shrink-0 flex items-center gap-1.5" style={{ position: "relative", zIndex: 2 }}>
          {hasSubs && (
            <ProgressButton
              done={doneCount}
              total={subs.length}
              open={open}
              onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            />
          )}
          {bought ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
              className="rounded-full px-3.5 h-9 text-[12.5px] font-bold transition-transform active:scale-95"
              style={{
                background: "rgba(20,170,95,0.12)",
                color: "#12a05a",
                border: "1px solid rgba(20,170,95,0.5)",
              }}
            >
              החזר לרשימה
            </button>
          ) : (
            <Checkbox
              checked={strike}
              onClick={(e) => {
                e.stopPropagation();
                if (!completing) onToggle(item.id);
              }}
            />
          )}
        </div>
      </div>

      {/* צ'קליסט תת-הפריטים — נגלל, ללא אייקונים, עם V לכל שורה */}
      {hasSubs && (
        <Collapsible open={open}>
          <div
            className="mt-1.5 rounded-2xl p-1.5 space-y-0.5"
            style={{ marginRight: 14, marginLeft: 6, ...glass({ background: "rgba(255,255,255,0.35)" }) }}
          >
            {subs.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-1.5 py-1">
                <MiniCheck checked={!!s.done} onClick={() => onToggleSub(item.id, s.id)} />
                <span
                  className="text-[13px] leading-tight"
                  style={{ color: s.done ? "#9aa8a0" : "#3a4a42", textDecoration: s.done ? "line-through" : "none" }}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
      </div>
    </div>
  );
}

/* כרטיס מסכם של "הושלמו" — נמוך, glass עדין יותר, נפתח/נסגר */
function CompletedSummary({ count, noun, open, onToggle, registerRef }) {
  return (
    <div ref={registerRef} style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 rounded-2xl px-3 py-2 transition-transform active:scale-[0.99]"
        style={glass({ background: "rgba(255,255,255,0.3)" })}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f8377" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 260ms ease" }}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-base">✅</span>
        <span className="text-[13px] font-medium text-stone-500">{count} {noun} שהושלמו</span>
      </button>
    </div>
  );
}

/* כותרת קבוצה הניתנת לקיפול */
function GroupHeader({ title, icon, toBuy, bought, labelActive, labelDone, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between rounded-2xl px-3 py-2.5 mb-2 transition-transform active:scale-[0.995]"
      style={glass({ background: "rgba(255,255,255,0.42)" })}
    >
      <div className="flex items-center gap-2">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6b62" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 260ms ease" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="text-lg">{icon}</span>
        <span className="font-bold text-[15px] text-stone-700">{title}</span>
      </div>
      <span className="text-[11px] text-stone-500">{toBuy} {labelActive} · {bought} {labelDone}</span>
    </button>
  );
}

/* קיפול חלק עם grid-rows */
function Collapsible({ open, children }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 300ms ease" }}>
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}

/* Bottom sheet כללי — סגירה בלחיצה על הרקע או בגרירה מטה */
function Sheet({ open, title, subtitle, onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(null);

  const onDown = (e) => {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    setDragY(dy > 0 ? dy : dy * 0.2); // מעט גמישות כלפי מעלה
  };
  const onUp = () => {
    if (startY.current == null) return;
    startY.current = null;
    setDragging(false);
    if (dragY > 110) onClose();
    setDragY(0);
  };

  const fade = open ? 0.28 * Math.max(0, 1 - dragY / 320) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        pointerEvents: open ? "auto" : "none",
        background: `rgba(40,55,48,${fade})`,
        transition: dragging ? "none" : "background 280ms ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-t-3xl flex flex-col"
        style={{
          ...glass({ background: "rgba(248,250,248,0.85)" }),
          maxHeight: "90vh",
          transform: open ? `translateY(${Math.max(dragY, 0)}px)` : "translateY(102%)",
          transition: dragging ? "none" : "transform 340ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* אזור אחיזה לגרירה — הידית והכותרת (קבוע למעלה) */}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="px-5 pt-3 shrink-0"
          style={{ touchAction: "none", cursor: "grab" }}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: "rgba(120,140,130,0.45)" }} />
          <h3 className="text-center font-bold text-stone-700 select-none" style={{ marginBottom: subtitle ? 2 : 16 }}>{title}</h3>
          {subtitle && (
            <div className="text-center text-[11px] text-stone-400 mb-3 select-none">{subtitle}</div>
          )}
        </div>
        {/* גוף נגלל — כך שבורר האייקונים נפתח מטה ודוחף את השאר, והכול נשאר בהישג יד */}
        <div className="px-5 pb-7 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* קבוצת כפתורי בחירה (pills) */
function Pills({ options, value, onChange, multi }) {
  const active = (o) => (multi ? value.includes(o) : value === o);
  const toggle = (o) => {
    if (multi) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    else onChange(value === o ? null : o);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => toggle(o)}
          className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-transform active:scale-95"
          style={
            active(o)
              ? { background: "rgba(74,150,110,0.92)", color: "#fff", border: "1px solid rgba(74,150,110,0.92)" }
              : glass({ background: "rgba(255,255,255,0.5)", color: "#586b60" })
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* שדה שם + בורר אייקון.
   הכפתור והשם נמצאים בשורה אחת; רשת האייקונים נפתחת ברוחב מלא מתחת לשורה,
   כך שהיא לא תופסת רוחב אופקי ולא דוחקת את שדה השם. */
function IconField({ emoji, name, onEmoji, onName, groups, placeholder }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const inputRef = useRef(null);

  // פירוק ל-graphemes (אימוג'י אחד = יחידה אחת, כולל ZWJ/גווני עור)
  const graphemes = (str) => {
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        return Array.from(seg.segment(str), (s) => s.segment);
      }
    } catch {}
    return Array.from(str);
  };
  const isEmoji = (ch) => {
    try { return /\p{Extended_Pictographic}/u.test(ch); } catch { return !!ch; }
  };

  const pressStart = useRef(0);
  const onDown = () => { pressStart.current = Date.now(); };
  const onClick = () => {
    const dur = Date.now() - pressStart.current;
    if (dur >= 400) {
      // לחיצה ארוכה → הפעל את שדה האימוג'י (focus סינכרוני בתוך הקליק → iOS פותח מקלדת)
      setCustom(true);
      setCustomVal("");
      if (inputRef.current) { inputRef.current.focus(); }
    } else {
      setOpen((o) => !o);
    }
  };
  const onCustomChange = (e) => {
    const gs = graphemes(e.target.value);
    const last = gs.length ? gs[gs.length - 1] : "";
    if (last && isEmoji(last)) { setCustomVal(last); onEmoji(last); }
    else setCustomVal("");
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* משבצת האייקון: שדה הקלדה קיים תמיד (מוסתר) + כפתור מעליו */}
        <div className="relative shrink-0 select-none" style={{ width: 48, height: 44, touchAction: "manipulation" }}>
          <input
            ref={inputRef}
            value={customVal}
            onChange={onCustomChange}
            onBlur={() => setCustom(false)}
            placeholder={emoji}
            inputMode="text"
            enterKeyHint="done"
            aria-label="הקלד אימוג׳י משלך"
            tabIndex={custom ? 0 : -1}
            className="absolute inset-0 w-full h-full text-center rounded-2xl text-2xl outline-none"
            style={{
              ...glass({ background: "rgba(255,255,255,0.7)" }),
              outline: custom ? "2px solid rgba(74,150,110,0.7)" : "none",
              opacity: custom ? 1 : 0,
              pointerEvents: custom ? "auto" : "none",
              caretColor: "#4a966e",
            }}
          />
          {!custom && (
            <button
              type="button"
              onPointerDown={onDown}
              onClick={onClick}
              onContextMenu={(e) => e.preventDefault()}
              aria-label="בחר אייקון (לחיצה ארוכה לאימוג׳י משלך)"
              className="absolute inset-0 w-full h-full grid place-items-center rounded-2xl text-xl transition-transform active:scale-90"
              style={{
                ...glass({ background: "rgba(255,255,255,0.5)" }),
                outline: open ? "2px solid rgba(74,150,110,0.7)" : "none",
              }}
            >
              {emoji}
            </button>
          )}
        </div>
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder={placeholder || "שם"}
          className="flex-1 min-w-0 h-11 px-3 rounded-2xl outline-none text-[14px] text-stone-700 placeholder:text-stone-400"
          style={glass({ background: "rgba(255,255,255,0.5)" })}
        />
      </div>
      <Collapsible open={open}>
        <div
          className="mt-2 p-2 rounded-2xl space-y-1.5"
          style={glass({ background: "rgba(255,255,255,0.5)" })}
        >
          {groups.map((g) => (
            <div key={g.label} className="flex justify-between">
              {g.items.map((e) => {
                const selected = e === emoji;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onEmoji(e); setOpen(false); }}
                    className="grid place-items-center rounded-lg text-lg transition-transform active:scale-90"
                    style={{
                      width: 38, height: 38,
                      background: selected ? "rgba(74,150,110,0.92)" : "transparent",
                      boxShadow: selected ? "inset 0 0 0 1px rgba(74,150,110,0.9)" : "none",
                    }}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

/* שורת תת-פריט עם אנימציית כניסה/יציאה */
function SubRow({ sub, onName, onDelete, removing }) {
  const [enter, setEnter] = useState(true); // מתחיל מכווץ, נפתח אחרי הרכבה
  useEffect(() => {
    const id = requestAnimationFrame(() => setEnter(false));
    return () => cancelAnimationFrame(id);
  }, []);
  const collapsed = enter || removing;
  return (
    <div
      style={{
        maxHeight: collapsed ? 0 : 60,
        opacity: collapsed ? 0 : 1,
        transform: collapsed ? "translateY(-6px) scale(0.98)" : "none",
        marginBottom: collapsed ? 0 : 6,
        overflow: "hidden",
        transition: "max-height 240ms ease, opacity 200ms ease, transform 240ms cubic-bezier(0.22,1,0.36,1), margin 240ms ease",
      }}
    >
      <div className="flex items-center gap-2">
        <input
          value={sub.name}
          onChange={(e) => onName(e.target.value)}
          className="flex-1 min-w-0 h-10 px-3 rounded-2xl outline-none text-[14px] text-stone-700"
          style={glass({ background: "rgba(255,255,255,0.5)" })}
        />
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 grid place-items-center rounded-xl transition-transform active:scale-90"
          style={{ width: 40, height: 40, background: "rgba(180,35,24,0.10)", color: "#b42318" }}
          aria-label="מחק"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

/* עורך תת-רשימה (בהוספה/עריכה) — ללא אייקונים, עם עריכת שם ומחיקה */
function SubListEditor({ subs, onChange }) {
  const [text, setText] = useState("");
  const [removing, setRemoving] = useState(() => new Set());
  const list = subs || [];
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([...list, { id: "s" + Date.now(), name: t, done: false }]);
    setText("");
  };
  const editName = (id, name) => onChange(list.map((s) => (s.id === id ? { ...s, name } : s)));
  const del = (id) => {
    setRemoving((s) => new Set(s).add(id));
    setTimeout(() => {
      onChange((subs || []).filter((s) => s.id !== id));
      setRemoving((s) => { const n = new Set(s); n.delete(id); return n; });
    }, 240);
  };
  return (
    <div>
      <div className="text-[12px] font-semibold text-stone-500 mb-2">תת-רשימה (אופציונלי)</div>
      <div>
        {list.map((s) => (
          <SubRow
            key={s.id}
            sub={s}
            removing={removing.has(s.id)}
            onName={(name) => editName(s.id, name)}
            onDelete={() => del(s.id)}
          />
        ))}
        <div className="flex items-center gap-2" style={{ marginTop: list.length ? 6 : 0 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="הוסף פריט לרשימה…"
            className="flex-1 min-w-0 h-10 px-3 rounded-2xl outline-none text-[14px] text-stone-700 placeholder:text-stone-400"
            style={glass({ background: "rgba(255,255,255,0.5)" })}
          />
          <button
            type="button"
            onClick={add}
            className="shrink-0 grid place-items-center rounded-xl text-white text-2xl leading-none transition-transform active:scale-90"
            style={{ width: 40, height: 40, background: "linear-gradient(180deg,#4ea27a,#3c7f5f)" }}
            aria-label="הוסף לרשימה"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- אפליקציה --------------------------- */

export default function ShoppingList() {
  const [items, setItems] = useState(loadItems);
  const [tab, setTab] = useState("shopping");
  const [dir, setDir] = useState(0); // כיוון מעבר הטאב: 1 / -1
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [closingGroups, setClosingGroups] = useState({}); // קבוצות באנימציית סגירה
  const [openGen, setOpenGen] = useState({}); // מזהה שמתחלף רק בפתיחה (מפעיל כניסה מדורגת)
  const groupCloseTimers = useRef({});
  const toggleGroup = (type, count = 0) => {
    const timers = groupCloseTimers.current;
    if (closingGroups[type]) return; // התעלמות בזמן אנימציית סגירה
    flipSuppress.current = Date.now() + 1100; // מנע קפיצת FLIP של הקבוצה השנייה
    const isOpen = !collapsedGroups[type];
    if (isOpen) {
      // סגירה דו-שלבית: (1) יציאה מדורגת הפוכה (2) קיפול גובה בעוד הכרטיסים מוסתרים
      setClosingGroups((p) => ({ ...p, [type]: true }));
      const exitTotal = Math.min(Math.max(count - 1, 0), 6) * 45 + 340;
      clearTimeout(timers[type]?.t1);
      clearTimeout(timers[type]?.t2);
      const t1 = setTimeout(() => setCollapsedGroups((p) => ({ ...p, [type]: true })), exitTotal);
      const t2 = setTimeout(() => setClosingGroups((p) => ({ ...p, [type]: false })), exitTotal + 320);
      timers[type] = { t1, t2 };
    } else {
      clearTimeout(timers[type]?.t1);
      clearTimeout(timers[type]?.t2);
      setClosingGroups((p) => ({ ...p, [type]: false }));
      setCollapsedGroups((p) => ({ ...p, [type]: false }));
      setOpenGen((p) => ({ ...p, [type]: (p[type] || 0) + 1 }));
    }
  };
  const [completedOpen, setCompletedOpen] = useState({});
  const [completedOpenGen, setCompletedOpenGen] = useState({}); // מתחלף רק בפתיחת "הושלמו"
  const [removing, setRemoving] = useState(new Set());

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ type: null, categories: [], priority: null, status: "all", who: [] });

  const [editing, setEditing] = useState(null);
  const [editOriginal, setEditOriginal] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState("shopping"); // מה מוסיפים כרגע (קניות/משימות), בלתי תלוי בטאב
  const [completePrompt, setCompletePrompt] = useState(null); // פופ-אפ השלמת "משתנים"
  const [promptClosing, setPromptClosing] = useState(false);   // אנימציית יציאה
  const [toast, setToast] = useState(null); // { msg, prev } לביטול פעולה
  const [completingIds, setCompletingIds] = useState(() => new Map()); // id -> "done" | "delete"
  const [draft, setDraft] = useState({ name: "", emoji: "🛒", category: "אוכל", type: "משתנים", priority: "low", note: "", who: null, subs: [] });

  const cfg = TABS.find((t) => t.key === tab);
  const addCfg = TABS.find((t) => t.key === addKind) || cfg;
  const flipSuppress = useRef(0);
  const register = useFlip(flipSuppress);

  /* ---- סנכרון משותף (Cloudflare Worker + KV) עם נפילה חזרה לאחסון מקומי ---- */
  const lastSyncJson = useRef(null);   // ה-JSON של מצב השרת האחרון שראינו
  const remoteApply = useRef(false);   // האם השינוי הנוכחי הגיע מהשרת
  const localDirty = useRef(false);    // האם יש שינוי מקומי שטרם נשמר לשרת
  const hydrated = useRef(false);      // האם הטעינה הראשונה מהשרת הסתיימה
  const saveTimer = useRef(null);

  // טעינה ראשונית מהשרת המשותף
  useEffect(() => {
    if (!SYNC_URL) { hydrated.current = true; return; }
    fetch(SYNC_URL, { headers: { Accept: "application/json" } })
      .then((r) => { if (!r.ok) throw new Error("GET " + r.status); return r.json(); })
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          lastSyncJson.current = JSON.stringify(data.items);
          remoteApply.current = true;
          setItems(data.items);
        } else {
          // אין עדיין רשימה תקינה — נזרע אותה במה שיש מקומית
          lastSyncJson.current = JSON.stringify(items);
          return fetch(SYNC_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ items }),
          });
        }
      })
      .catch(() => {}) // לא זמין — ממשיכים מקומית
      .finally(() => { hydrated.current = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // שמירה: מקומי תמיד, ולשרת בהשהיה קצרה — אך ורק אחרי שהטעינה הראשונה הסתיימה
  useEffect(() => {
    saveItems(items); // גיבוי מקומי / מצב לא-מקוון
    if (!SYNC_URL) return;
    if (!hydrated.current) return;                 // מונע דריסה של השרת בזמן עלייה
    if (remoteApply.current) {
      remoteApply.current = false;
      lastSyncJson.current = JSON.stringify(items);
      return;
    }
    const json = JSON.stringify(items);
    if (json === lastSyncJson.current) return;
    localDirty.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(SYNC_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("PUT " + r.status);
          lastSyncJson.current = json;
          localDirty.current = false;
        })
        .catch(() => { localDirty.current = false; });
    }, 500);
  }, [items]);

  // poll — לקלוט שינויים שבן בית אחר עשה
  useEffect(() => {
    if (!SYNC_URL) return;
    const id = setInterval(() => {
      if (localDirty.current) return; // יש שינוי מקומי בדרך — לא לדרוס
      fetch(SYNC_URL, { headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.items)) return;
          const json = JSON.stringify(data.items);
          if (json === lastSyncJson.current) return;
          lastSyncJson.current = json;
          remoteApply.current = true;
          setItems(data.items);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyFilters = { type: null, categories: [], priority: null, status: "all", who: [] };

  const switchTab = (key) => {
    if (key === tab) return;
    const from = TABS.findIndex((t) => t.key === tab);
    const to = TABS.findIndex((t) => t.key === key);
    setDir(to > from ? 1 : -1);
    setFilters(emptyFilters);
    setSearch("");
    setTab(key);
  };

  /* ---- סינון + חיפוש (לפי הטאב הפעיל) ---- */
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (it.kind !== tab) return false;
      if (search && !it.name.includes(search.trim())) return false;
      if (filters.type && it.type !== filters.type) return false;
      if (filters.categories.length && !filters.categories.includes(it.category)) return false;
      if (filters.priority && it.priority !== filters.priority) return false;
      if (filters.who.length && !filters.who.includes(it.who)) return false;
      if (filters.status === "active" && it.status !== "active") return false;
      if (filters.status === "done" && it.status !== "done") return false;
      return true;
    });
  }, [items, tab, search, filters]);

  /* ---- קיבוץ לפי type + מיון ---- */
  const groups = useMemo(() => {
    const out = TYPES.map((t) => {
      const list = filtered.filter((it) => it.type === t);
      const active = list
        .filter((it) => it.status === "active")
        .sort((a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank);
      const bought = list.filter((it) => it.status === "done");
      return { type: t, active, bought };
    }).filter((g) => g.active.length || g.bought.length);
    return out;
  }, [filtered]);

  /* ---- סטטיסטיקה ---- */
  const stats = useMemo(() => {
    const mine = items.filter((i) => i.kind === tab);
    const toBuy = mine.filter((i) => i.status === "active").length;
    const urgent = mine.filter((i) => i.status === "active" && i.priority === "high").length;
    const bought = mine.filter((i) => i.status === "done").length;
    return { toBuy, urgent, bought };
  }, [items, tab]);

  /* ---- מספר הסינונים הפעילים ---- */
  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.categories.length +
    (filters.priority ? 1 : 0) +
    filters.who.length +
    (filters.status !== "all" ? 1 : 0);

  /* ---- טוסט Undo ---- */
  const toastTimer = useRef(null);
  const toastCloseTimer = useRef(null);
  const removeTimer = useRef(null);
  const completionTimers = useRef(new Map());
  const [toastClosing, setToastClosing] = useState(false);
  const dismissToast = () => {
    setToastClosing(true);
    clearTimeout(toastCloseTimer.current);
    toastCloseTimer.current = setTimeout(() => { setToast(null); setToastClosing(false); }, 240);
  };
  const showToast = (msg, prev) => {
    clearTimeout(toastCloseTimer.current);
    setToastClosing(false);
    setToast({ msg, prev });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(dismissToast, 4000);
  };
  const undoToast = () => {
    clearTimeout(removeTimer.current);
    clearTimeout(toastTimer.current);
    completionTimers.current.forEach((t) => clearTimeout(t));
    completionTimers.current.clear();
    setCompletingIds(new Map());
    if (toast?.prev) { setItems(toast.prev); setRemoving(new Set()); }
    dismissToast();
  };
  const doneMsg = (it) => `${it.name} ${it.kind === "shopping" ? "נקנה" : "בוצע"}`;

  // אנימציית השלמה (ירוק): מסגרת → מילוי → מעבר ל"הושלמו"
  const startCompletion = (it, extraPatch = {}) => {
    const hasPatch = Object.keys(extraPatch).length > 0;
    if (hasPatch) {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...extraPatch, updated: nowStamp() } : x)));
    }
    setCompletingIds((m) => new Map(m).set(it.id, "done"));
    showToast(doneMsg(it), items);
    const t = setTimeout(() => {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...extraPatch, status: "done", updated: nowStamp() } : x)));
      setCompletingIds((m) => { const n = new Map(m); n.delete(it.id); return n; });
      completionTimers.current.delete(it.id);
    }, 620);
    completionTimers.current.set(it.id, t);
  };

  // אנימציית מחיקה (אדום): מסגרת → מילוי → הכרטיס מתקפל ונמחק
  const startDeletion = (it) => {
    setCompletingIds((m) => new Map(m).set(it.id, "delete"));
    showToast(`${it.name} נמחק`, items);
    const t = setTimeout(() => {
      setCompletingIds((m) => { const n = new Map(m); n.delete(it.id); return n; });
      setRemoving((s) => new Set(s).add(it.id));
      clearTimeout(removeTimer.current);
      removeTimer.current = setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== it.id));
        setRemoving((s) => { const n = new Set(s); n.delete(it.id); return n; });
      }, 260);
      completionTimers.current.delete(it.id);
    }, 620);
    completionTimers.current.set(it.id, t);
  };

  /* ---- פעולות ---- */
  const toggle = (id) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: it.status === "active" ? "done" : "active", updated: nowStamp() }
          : it
      )
    );

  // סימון פריט: אם זה פריט "משתנים" שמסמנים כהושלם — פותחים פופ-אפ בחירה.
  // אחרת (קבועים, או ביטול סימון של פריט שכבר בוצע) — התנהגות רגילה.
  const handleCheck = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;

    // פריט עם תת-רשימה: הסימון הראשי מסמן/מבטל את כל התת-פריטים
    if (it.subs && it.subs.length) {
      if (it.status === "active") {
        const subs = it.subs.map((s) => ({ ...s, done: true }));
        if (it.type === "משתנים") {
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, subs, updated: nowStamp() } : x)));
          setCompletePrompt({ ...it, subs });
          setPromptClosing(false);
        } else {
          startCompletion(it, { subs }); // קבוע — אנימציית השלמה
        }
      } else {
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "active", priority: "low", subs: x.subs.map((s) => ({ ...s, done: false })), updated: nowStamp() } : x)));
      }
      return;
    }

    if (it.status === "active" && it.type === "משתנים") {
      setCompletePrompt(it);
      setPromptClosing(false);
    } else if (it.status === "active") {
      startCompletion(it); // קבוע — אנימציית השלמה
    } else {
      // החזרה לרשימה — איפוס חשיבות ל"רגיל"
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "active", priority: "low", updated: nowStamp() } : x)));
    }
  };

  // סימון תת-פריט. כשכל התת-פריטים מסומנים — הפריט הראשי מושלם
  // (למשתנים נפתח הפופ-אפ, לקבועים עובר ישירות ל"בוצע").
  const toggleSub = (itemId, subId) => {
    const it = items.find((x) => x.id === itemId);
    if (!it || !it.subs) return;
    const subs = it.subs.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    const allDone = subs.length > 0 && subs.every((s) => s.done);

    if (allDone && it.status === "active" && it.type === "משתנים") {
      setItems((prev) => prev.map((x) => (x.id === itemId ? { ...x, subs, updated: nowStamp() } : x)));
      setCompletePrompt({ ...it, subs });
      setPromptClosing(false);
      return;
    }
    if (allDone && it.status === "active") {
      // קבוע — אנימציית השלמה עם התת-פריטים המעודכנים
      startCompletion(it, { subs });
      return;
    }
    const willReopen = !allDone && it.status === "done";
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== itemId) return x;
        const status = willReopen ? "active" : x.status;
        return { ...x, subs, status, updated: nowStamp() };
      })
    );
  };

  // סגירת הפופ-אפ עם אנימציית יציאה, ואז ביצוע הפעולה
  const closePrompt = (action) => {
    if (promptClosing) return;
    const target = completePrompt;
    setPromptClosing(true);
    setTimeout(() => {
      if (target) {
        if (action === "done") startCompletion(target);
        else if (action === "delete") startDeletion(target);
      }
      setCompletePrompt(null);
      setPromptClosing(false);
    }, 170);
  };

  const remove = (id) => {
    const it = items.find((x) => x.id === id);
    setEditing(null);
    if (it) startDeletion(it);
  };

  const updateEditing = (patch) => {
    setEditing((e) => (e ? { ...e, ...patch } : e));
  };

  const openEdit = (item) => {
    setEditOriginal(item);
    setEditing({ ...item });
  };

  const EDIT_FIELDS = ["name", "emoji", "category", "type", "priority", "note", "who"];
  const editDirty =
    !!editing && !!editOriginal &&
    (EDIT_FIELDS.some((k) => (editing[k] ?? "") !== (editOriginal[k] ?? "")) ||
      JSON.stringify(editing.subs || []) !== JSON.stringify(editOriginal.subs || []));

  const confirmEdit = () => {
    if (!editing) return;
    if (editDirty) {
      setItems((prev) => prev.map((it) => (it.id === editing.id ? { ...editing, updated: nowStamp() } : it)));
    }
    setEditing(null);
  };

  const addItem = () => {
    if (!draft.name.trim()) return;
    const id = "n" + Date.now();
    const kind = addKind;
    setItems((prev) => [{ ...draft, id, kind, status: "active", updated: nowStamp() }, ...prev]);
    setAddOpen(false);
    if (kind !== tab) switchTab(kind); // להראות את הפריט שנוסף
  };

  const openAdd = () => {
    const k = tab;
    setAddKind(k);
    const c = TABS.find((t) => t.key === k);
    const ic = iconsFor(c, c.defaultCategory);
    setDraft({
      name: "", emoji: ic[0] || c.defaultEmoji, category: c.defaultCategory,
      type: "משתנים", priority: "low", note: "", subs: [],
      who: c.assignees ? (c.assignees.includes("כולם") ? "כולם" : c.assignees[0]) : null,
    });
    setAddOpen(true);
  };

  // מעבר בין "קניות" ל"משימות" בתוך חלון ההוספה — מאפס רק שדות תלויי-סוג
  const chooseAddKind = (kind) => {
    if (kind === addKind) return;
    setAddKind(kind);
    const c = TABS.find((t) => t.key === kind);
    const ic = iconsFor(c, c.defaultCategory);
    setDraft((d) => ({
      ...d,
      emoji: ic[0] || c.defaultEmoji,
      category: c.defaultCategory,
      who: c.assignees ? (c.assignees.includes("כולם") ? "כולם" : c.assignees[0]) : null,
    }));
  };

  const groupIcon = (t) => (t === "קבועים" ? "🔁" : "🔀");

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        fontFamily: "'SF Pro Display', -apple-system, 'Segoe UI', system-ui, sans-serif",
        backgroundColor: "#e9eee9",
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      {/* רקע אווירה — שכבות אור רכות */}
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.32) 100%)",
        }}
      />

      <style>{`
        @keyframes tabFromLeft { from { opacity: 0; transform: translateX(-16%); } to { opacity: 1; transform: none; } }
        @keyframes tabFromRight { from { opacity: 0; transform: translateX(16%); } to { opacity: 1; transform: none; } }
        @keyframes popBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popBackdropOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes popCardIn {
          0% { opacity: 0; transform: scale(0.82) translateY(8px); }
          60% { opacity: 1; transform: scale(1.03) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes popCardOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.9) translateY(6px); }
        }
        @keyframes cardStagger {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardExit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-14px) scale(0.975); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-16px) scale(0.97); }
        }
        @keyframes drawBorder { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes fillFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div
        key={tab}
        className="relative mx-auto max-w-[400px] px-3.5 pb-28 pt-4"
        style={{ animation: `${dir < 0 ? "tabFromRight" : "tabFromLeft"} 300ms cubic-bezier(0.22,1,0.36,1)` }}
      >
        {/* כותרת זעירה + סטטיסטיקה משמאל */}
        <header className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <StatCard value={stats.bought} label={cfg.statusDone} tint="#4a9670" />
            <StatCard value={stats.urgent} label="דחופים" tint="#d6492f" />
            <StatCard value={stats.toBuy} label={cfg.statusActive} tint="#3c5a4b" />
          </div>
          <div className="text-right">
            <div className="text-[11px] text-stone-400 leading-none">{cfg.kicker}</div>
            <div className="text-[15px] font-bold text-stone-700 leading-tight">{cfg.title}</div>
          </div>
        </header>

        {/* חיפוש + סינון באותה שורה */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 rounded-2xl px-3.5 h-11" style={glass()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8a978f" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`חיפוש ${cfg.word}...`}
              className="flex-1 bg-transparent outline-none text-[14px] text-stone-700 placeholder:text-stone-400"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="סינון"
            className="relative shrink-0 grid place-items-center rounded-2xl transition-transform active:scale-90"
            style={
              activeFilterCount > 0
                ? {
                    width: 44, height: 44,
                    background: "linear-gradient(180deg, #4ea27a, #3c7f5f)",
                    border: "1px solid rgba(74,150,110,0.9)",
                    boxShadow: "0 8px 20px -8px rgba(60,127,95,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }
                : { width: 44, height: 44, ...glass() }
            }
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={activeFilterCount > 0 ? "#ffffff" : "#5a6b62"}
              strokeWidth="2.2" strokeLinecap="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2.2" fill={activeFilterCount > 0 ? "#3c7f5f" : "#eef3ef"} />
              <line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2.2" fill={activeFilterCount > 0 ? "#3c7f5f" : "#eef3ef"} />
              <line x1="4" y1="18" x2="20" y2="18" /><circle cx="8" cy="18" r="2.2" fill={activeFilterCount > 0 ? "#3c7f5f" : "#eef3ef"} />
            </svg>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1.5 -left-1.5 grid place-items-center text-[10px] font-bold text-white rounded-full"
                style={{
                  minWidth: 18, height: 18, padding: "0 4px",
                  background: "#d6492f",
                  boxShadow: "0 2px 6px -1px rgba(214,73,47,0.6), 0 0 0 2px rgba(255,255,255,0.85)",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* קבוצות */}
        {groups.map((g) => {
          const groupOpen = !collapsedGroups[g.type];
          const groupClosing = !!closingGroups[g.type];
          const showSummary = g.bought.length > 4;
          const boughtOpen = !!completedOpen[g.type];
          return (
            <section key={g.type} className="mb-3">
              <GroupHeader
                title={g.type === "קבועים" ? "קבועים / חוזרים" : "משתנים"}
                icon={groupIcon(g.type)}
                toBuy={g.active.length}
                bought={g.bought.length}
                labelActive={cfg.statusActive}
                labelDone={cfg.statusDone}
                open={groupOpen && !groupClosing}
                onToggle={() => toggleGroup(g.type, g.active.length)}
              />

              <Collapsible open={groupOpen}>
                {/* פעילים */}
                {g.active.map((it, i) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    registerRef={register(it.id)}
                    onToggle={handleCheck}
                    onToggleSub={toggleSub}
                    onEdit={openEdit}
                    removing={removing.has(it.id)}
                    completing={completingIds.get(it.id) || null}
                    enterIndex={i}
                    count={g.active.length}
                    closing={groupClosing}
                    enterToken={`${g.type}-${openGen[g.type] || 0}`}
                  />
                ))}

                {/* הושלמו */}
                {g.bought.length > 0 && (
                  showSummary ? (
                    <>
                      <CompletedSummary
                        count={g.bought.length}
                        noun={cfg.key === "shopping" ? "פריטים" : "משימות"}
                        open={boughtOpen}
                        registerRef={register("sum-" + g.type)}
                        onToggle={() => {
                          flipSuppress.current = Date.now() + 1100;
                          const willOpen = !completedOpen[g.type];
                          setCompletedOpen((p) => ({ ...p, [g.type]: !p[g.type] }));
                          if (willOpen) setCompletedOpenGen((p) => ({ ...p, [g.type]: (p[g.type] || 0) + 1 }));
                        }}
                      />
                      <Collapsible open={boughtOpen}>
                        {g.bought.map((it, i) => (
                          <ItemCard
                            key={it.id}
                            item={it}
                            registerRef={register(it.id)}
                            onToggle={handleCheck}
                            onToggleSub={toggleSub}
                            onEdit={openEdit}
                            removing={removing.has(it.id)}
                            completing={completingIds.get(it.id) || null}
                            enterIndex={i}
                            enterToken={`${g.type}-b-${completedOpenGen[g.type] || 0}`}
                          />
                        ))}
                      </Collapsible>
                    </>
                  ) : (
                    g.bought.map((it, i) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        registerRef={register(it.id)}
                        onToggle={handleCheck}
                        onToggleSub={toggleSub}
                        onEdit={openEdit}
                        removing={removing.has(it.id)}
                        completing={completingIds.get(it.id) || null}
                        enterIndex={i}
                        enterToken={`${g.type}-bi-${openGen[g.type] || 0}`}
                      />
                    ))
                  )
                )}
              </Collapsible>
            </section>
          );
        })}

        {groups.length === 0 && (
          <div className="text-center text-stone-400 text-sm mt-12">לא נמצאו פריטים. נסו לשנות חיפוש או סינון.</div>
        )}
      </div>

      {/* שורה תחתונה: כפתור + מימין (מנותק) · תפריט טאבים משמאל */}
      <div className="fixed bottom-4 left-0 right-0 z-40">
        <div className="mx-auto max-w-[400px] px-3.5 flex items-center justify-between gap-2">
          {/* כפתור הוספה — עיגול עם + , מותאם לטאב הנוכחי */}
          <button
            onClick={openAdd}
            aria-label={`הוסף ${cfg.word}`}
            className="shrink-0 grid place-items-center rounded-full transition-transform active:scale-90"
            style={{
              width: 52, height: 52,
              background: "linear-gradient(180deg, #4ea27a, #3c7f5f)",
              boxShadow: "0 10px 26px -8px rgba(60,127,95,0.6), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* תפריט טאבים — Liquid Glass */}
          <div className="flex gap-1 rounded-full p-1" style={glass({ background: "rgba(255,255,255,0.55)" })}>
            {TABS.map((t) => {
              const activeTab = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  className="flex items-center gap-1.5 rounded-full px-4 h-10 text-[14px] font-bold transition-transform active:scale-95"
                  style={
                    activeTab
                      ? {
                          background: "linear-gradient(180deg, #4ea27a, #3c7f5f)",
                          color: "#fff",
                          boxShadow: "0 6px 16px -6px rgba(60,127,95,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
                        }
                      : { background: "transparent", color: "#5a6b62" }
                  }
                >
                  <span className="text-base">{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sheet — סינון */}
      <Sheet open={filterOpen} title={`סינון ${cfg.key === "shopping" ? "פריטים" : "משימות"}`} onClose={() => setFilterOpen(false)}>
        <div className="space-y-4">
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">סוג</div>
            <Pills options={TYPES} value={filters.type} onChange={(v) => setFilters((f) => ({ ...f, type: v }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">קטגוריה</div>
            <Pills options={cfg.categories} value={filters.categories} multi onChange={(v) => setFilters((f) => ({ ...f, categories: v }))} />
          </div>
          {cfg.assignees && (
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">אחראי</div>
              <Pills options={cfg.assignees} value={filters.who} multi onChange={(v) => setFilters((f) => ({ ...f, who: v }))} />
            </div>
          )}
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">חשיבות</div>
            <Pills options={["high", "medium", "low"].map((k) => PRIORITY[k].label)}
              value={filters.priority ? PRIORITY[filters.priority].label : null}
              onChange={(label) => {
                const key = Object.keys(PRIORITY).find((k) => PRIORITY[k].label === label) || null;
                setFilters((f) => ({ ...f, priority: key }));
              }} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">סטטוס</div>
            <Pills options={[cfg.statusActive, cfg.statusDone, "הכל"]}
              value={{ active: cfg.statusActive, done: cfg.statusDone, all: "הכל" }[filters.status]}
              onChange={(label) => {
                const map = { [cfg.statusActive]: "active", [cfg.statusDone]: "done", "הכל": "all" };
                setFilters((f) => ({ ...f, status: map[label] || "all" }));
              }} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setFilters(emptyFilters)}
              className="flex-1 rounded-2xl h-11 font-semibold text-stone-600"
              style={glass({ background: "rgba(255,255,255,0.5)" })}
            >
              נקה סינון
            </button>
            <button
              onClick={() => setFilterOpen(false)}
              className="flex-1 rounded-2xl h-11 font-bold text-white"
              style={{ background: "linear-gradient(180deg,#4ea27a,#3c7f5f)" }}
            >
              החל
            </button>
          </div>
        </div>
      </Sheet>

      {/* Sheet — עריכה */}
      <Sheet open={!!editing} title={editing ? `עריכת ${editing.name}` : ""} subtitle={editing ? `עודכן ${editing.updated}` : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-4">
            <IconField
              emoji={editing.emoji}
              name={editing.name}
              onEmoji={(emoji) => updateEditing({ emoji })}
              onName={(name) => updateEditing({ name })}
              groups={[{ label: editing.category, items: iconsFor(cfg, editing.category) }]}
              placeholder={`שם ${cfg.word === "פריט" ? "הפריט" : "המשימה"}`}
            />
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">סוג</div>
              <Pills options={TYPES} value={editing.type} onChange={(v) => v && updateEditing({ type: v })} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">קטגוריה</div>
              <Pills options={cfg.categories} value={editing.category} onChange={(v) => v && updateEditing({ category: v, emoji: iconsFor(cfg, v)[0] || editing.emoji })} />
            </div>
            {cfg.assignees && (
              <div>
                <div className="text-[12px] font-semibold text-stone-500 mb-2">אחראי</div>
                <Pills options={cfg.assignees} value={editing.who} onChange={(v) => v && updateEditing({ who: v })} />
              </div>
            )}
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">חשיבות</div>
              <Pills
                options={["high", "medium", "low"].map((k) => PRIORITY[k].label)}
                value={PRIORITY[editing.priority].label}
                onChange={(label) => {
                  const key = Object.keys(PRIORITY).find((k) => PRIORITY[k].label === label);
                  if (key) updateEditing({ priority: key });
                }}
              />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">הערה</div>
              <textarea
                value={editing.note || ""}
                onChange={(e) => updateEditing({ note: e.target.value })}
                placeholder="לדוגמה: פרטים נוספים, מותג, דדליין..."
                rows={2}
                className="w-full rounded-2xl px-3 py-2 outline-none text-[14px] text-stone-700 placeholder:text-stone-400 resize-none"
                style={glass({ background: "rgba(255,255,255,0.5)" })}
              />
            </div>
            <SubListEditor subs={editing.subs || []} onChange={(subs) => updateEditing({ subs })} />
            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmEdit}
                disabled={!editDirty}
                className="flex-1 rounded-2xl h-11 font-bold text-white transition-transform active:scale-[0.98]"
                style={
                  editDirty
                    ? { background: "linear-gradient(180deg,#4ea27a,#3c7f5f)", cursor: "pointer" }
                    : { background: "rgba(120,140,130,0.25)", color: "rgba(90,107,98,0.6)", cursor: "not-allowed" }
                }
              >
                אשר
              </button>
              <button
                onClick={() => remove(editing.id)}
                className="flex-1 rounded-2xl h-11 font-bold transition-transform active:scale-[0.98]"
                style={{ background: "rgba(255,99,99,0.15)", color: "#b42318", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                מחק
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Sheet — הוספה */}
      <Sheet open={addOpen} title={`הוספת ${addCfg.word}`} onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          {/* בורר: מה מוסיפים — קניות או משימות */}
          <div
            className="flex p-1 rounded-2xl"
            style={glass({ background: "rgba(255,255,255,0.5)" })}
          >
            {TABS.map((t) => {
              const on = addKind === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => chooseAddKind(t.key)}
                  className="flex-1 h-9 rounded-xl text-[14px] font-bold transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                  style={
                    on
                      ? { background: "linear-gradient(180deg,#4ea27a,#3c7f5f)", color: "#fff" }
                      : { background: "transparent", color: "#6b7d72" }
                  }
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <IconField
            emoji={draft.emoji}
            name={draft.name}
            onEmoji={(emoji) => setDraft((d) => ({ ...d, emoji }))}
            onName={(name) => setDraft((d) => ({ ...d, name }))}
            groups={[{ label: draft.category, items: iconsFor(addCfg, draft.category) }]}
            placeholder={`שם ${addCfg.word === "פריט" ? "הפריט" : "המשימה"}`}
          />
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">סוג</div>
            <Pills options={TYPES} value={draft.type} onChange={(v) => v && setDraft((d) => ({ ...d, type: v }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">קטגוריה</div>
            <Pills
              options={addCfg.categories}
              value={draft.category}
              onChange={(v) => v && setDraft((d) => ({ ...d, category: v, emoji: iconsFor(addCfg, v)[0] || d.emoji }))}
            />
          </div>
          {addCfg.assignees && (
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">אחראי</div>
              <Pills options={addCfg.assignees} value={draft.who} onChange={(v) => v && setDraft((d) => ({ ...d, who: v }))} />
            </div>
          )}
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">חשיבות</div>
            <Pills
              options={["high", "medium", "low"].map((k) => PRIORITY[k].label)}
              value={PRIORITY[draft.priority].label}
              onChange={(label) => {
                const key = Object.keys(PRIORITY).find((k) => PRIORITY[k].label === label);
                if (key) setDraft((d) => ({ ...d, priority: key }));
              }}
            />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">הערה</div>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="לדוגמה: פרטים נוספים, מותג, דדליין..."
              rows={2}
              className="w-full rounded-2xl px-3 py-2 outline-none text-[14px] text-stone-700 placeholder:text-stone-400 resize-none"
              style={glass({ background: "rgba(255,255,255,0.5)" })}
            />
          </div>
          <SubListEditor subs={draft.subs || []} onChange={(subs) => setDraft((d) => ({ ...d, subs }))} />
          <button onClick={addItem} className="w-full rounded-2xl h-11 font-bold text-white" style={{ background: "linear-gradient(180deg,#4ea27a,#3c7f5f)" }}>
            הוסף לרשימה
          </button>
        </div>
      </Sheet>

      {/* ===== פופ-אפ השלמת פריט "משתנים" ===== */}
      {completePrompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{
            background: "rgba(20,30,25,0.5)",
            backdropFilter: "blur(2px)",
            animation: `${promptClosing ? "popBackdropOut" : "popBackdropIn"} 180ms ease forwards`,
          }}
          onClick={() => closePrompt(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            className="w-full max-w-[340px] rounded-3xl p-5 text-center"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 24px 60px -20px rgba(0,0,0,0.45)",
              animation: promptClosing
                ? "popCardOut 170ms cubic-bezier(0.4,0,1,1) forwards"
                : "popCardIn 320ms cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <div className="text-4xl mb-2">{completePrompt.emoji || "✅"}</div>
            <div className="font-bold text-[17px] text-stone-700 mb-1">
              {completePrompt.name} {completePrompt.kind === "shopping" ? "נקנה" : "הושלם"}!
            </div>
            <div className="text-[13px] text-stone-400 mb-5">מה לעשות עם הפריט?</div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => closePrompt("done")}
                className="w-full rounded-2xl h-11 font-bold text-white transition-transform active:scale-95"
                style={{ background: "linear-gradient(180deg,#4ea27a,#3c7f5f)" }}
              >
                להעביר לסטטוס מבוצע
              </button>
              <button
                onClick={() => closePrompt("delete")}
                className="w-full rounded-2xl h-11 font-bold transition-transform active:scale-95"
                style={{ background: "rgba(180,35,24,0.10)", color: "#b42318", border: "1px solid rgba(180,35,24,0.18)" }}
              >
                למחוק
              </button>
              <button
                onClick={() => closePrompt(null)}
                className="w-full rounded-2xl h-9 text-[13px] font-medium text-stone-400"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== טוסט Undo (עליון, בסגנון iOS) ===== */}
      {toast && (
        <div className="fixed top-3 left-0 right-0 z-[70] flex justify-center px-4 pointer-events-none">
          <div
            dir="rtl"
            className="pointer-events-auto flex items-center gap-3 rounded-2xl pr-4 pl-2 py-2.5 w-full max-w-[360px]"
            style={{
              background: "rgba(38,48,43,0.94)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 14px 34px -12px rgba(0,0,0,0.55)",
              animation: toastClosing
                ? "toastOut 240ms ease forwards"
                : "toastIn 260ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <span className="flex-1 text-[14px] font-medium text-white text-right">{toast.msg}</span>
            <button
              onClick={undoToast}
              className="shrink-0 rounded-xl px-3 h-8 text-[14px] font-bold transition-transform active:scale-95"
              style={{ background: "rgba(95,208,160,0.16)", color: "#5fd0a0" }}
            >
              בטל
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  להחלפה ב-Framer Motion (אם תתקין `npm i framer-motion`):
 *  - הסר את useFlip ואת registerRef.
 *  - עטוף את רשימת הכרטיסים ב-<AnimatePresence> וכל כרטיס ב-<motion.div
 *      layout
 *      initial={{ opacity: 0, y: 12 }}
 *      animate={{ opacity: item.status === "done" ? 0.7 : 1, y: 0 }}
 *      exit={{ opacity: 0, scale: 0.96 }}
 *      transition={{ layout: { type: "spring", stiffness: 420, damping: 34 } }}
 *    >.
 *  זהו — ה-prop `layout` נותן בדיוק את אנימציית ה-reorder החלקה.
 * ------------------------------------------------------------------ */
