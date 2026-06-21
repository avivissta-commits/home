import { useState, useLayoutEffect, useRef, useMemo } from "react";

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

const seedShopping = [
  { kind: "shopping", id: "i1", name: "נייר סופג", emoji: "🧻", category: "ניקיון", type: "קבועים", priority: "high", status: "active", updated: "21.06.26", note: "לקנות 2 חבילות גדולות, רק מהמותג הירוק" },
  { kind: "shopping", id: "i2", name: "חבילת טישו", emoji: "🧻", category: "ניקיון", type: "קבועים", priority: "medium", status: "active", updated: "21.06.26" },
  { kind: "shopping", id: "i3", name: "קשים מתכת", emoji: "🛒", category: "בית", type: "קבועים", priority: "low", status: "active", updated: "21.06.26" },
  { kind: "shopping", id: "i4", name: "גלי מגבונים", emoji: "🧽", category: "ניקיון", type: "קבועים", priority: "low", status: "active", updated: "21.06.26" },
  { kind: "shopping", id: "i5", name: "סבון כלים", emoji: "🧴", category: "ניקיון", type: "קבועים", priority: "medium", status: "active", updated: "20.06.26" },
  { kind: "shopping", id: "b1", name: "נייר טואלט", emoji: "🧻", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "19.06.26" },
  { kind: "shopping", id: "b2", name: "מרכך כביסה", emoji: "🧴", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "19.06.26" },
  { kind: "shopping", id: "b3", name: "אבקת כביסה", emoji: "🧺", category: "ניקיון", type: "קבועים", priority: "medium", status: "done", updated: "18.06.26" },
  { kind: "shopping", id: "b4", name: "ספוגות", emoji: "🧽", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "18.06.26" },
  { kind: "shopping", id: "b5", name: "מטליות", emoji: "🧻", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "17.06.26" },
  { kind: "shopping", id: "b6", name: "שקיות זבל", emoji: "🗑️", category: "בית", type: "קבועים", priority: "low", status: "done", updated: "17.06.26" },

  { kind: "shopping", id: "v1", name: "אקמול", emoji: "💊", category: "תרופות", type: "משתנים", priority: "high", status: "active", updated: "21.06.26" },
  { kind: "shopping", id: "v2", name: "אבוקדו", emoji: "🥑", category: "אוכל", type: "משתנים", priority: "medium", status: "active", updated: "21.06.26" },
  { kind: "shopping", id: "v3", name: "קפה", emoji: "☕", category: "אוכל", type: "משתנים", priority: "low", status: "active", updated: "20.06.26" },
  { kind: "shopping", id: "v4", name: "שמפו", emoji: "🧴", category: "טיפוח", type: "משתנים", priority: "low", status: "active", updated: "20.06.26" },
  { kind: "shopping", id: "vb1", name: "חלב", emoji: "🥛", category: "אוכל", type: "משתנים", priority: "low", status: "done", updated: "19.06.26" },
  { kind: "shopping", id: "vb2", name: "לחם", emoji: "🍞", category: "אוכל", type: "משתנים", priority: "low", status: "done", updated: "19.06.26" },
];

const seedTasks = [
  { kind: "task", id: "t1", name: "כביסה", emoji: "🧺", category: "כביסה", type: "קבועים", priority: "high", status: "active", updated: "21.06.26", who: "אביב", note: "המכונה כבר מלאה" },
  { kind: "task", id: "t3", name: "שטיפת כלים", emoji: "🧽", category: "ניקיון", type: "קבועים", priority: "high", status: "active", updated: "21.06.26", who: "אביב" },
  { kind: "task", id: "t4", name: "ניקיון שירותים", emoji: "🚿", category: "ניקיון", type: "קבועים", priority: "medium", status: "active", updated: "21.06.26", who: "יוסי" },
  { kind: "task", id: "t5", name: "תשלום חשבון חשמל", emoji: "🧾", category: "חשבונות", type: "קבועים", priority: "high", status: "active", updated: "20.06.26", who: "אביב", note: "עד ה-25 לחודש" },
  { kind: "task", id: "td1", name: "ניגוב אבק", emoji: "🧹", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "19.06.26", who: "אביב" },
  { kind: "task", id: "td2", name: "הוצאת זבל", emoji: "🗑️", category: "ניקיון", type: "קבועים", priority: "low", status: "done", updated: "19.06.26", who: "יוסי" },

  { kind: "task", id: "t2", name: "קיפול בגדים", emoji: "👕", category: "סידור", type: "משתנים", priority: "medium", status: "active", updated: "21.06.26", who: "יוסי" },
  { kind: "task", id: "t6", name: "סידור סלון", emoji: "🛋️", category: "סידור", type: "משתנים", priority: "low", status: "active", updated: "20.06.26", who: "כולם" },
  { kind: "task", id: "t7", name: "סידור ארון", emoji: "📦", category: "סידור", type: "משתנים", priority: "low", status: "active", updated: "20.06.26", who: "אביב" },
];

const seedItems = [...seedShopping, ...seedTasks];

const SHOPPING_CATEGORIES = ["ניקיון", "אוכל", "תרופות", "בית", "טיפוח"];
const TASK_CATEGORIES = ["ניקיון", "סידור", "כביסה", "חשבונות", "כללי"];
const TYPES = ["קבועים", "משתנים"];
const ASSIGNEES = ["אביב", "יוסי", "כולם"];
const WHO_COLORS = { "אביב": "#2f8f73", "יוסי": "#4f6bd0", "כולם": "#7a7f8c" };

// אוסף אייקונים — 5 מכל קטגוריה, כל חמישייה מכסה כמה שיותר סוגים שונים
const SHOPPING_EMOJIS = [
  { label: "אוכל", items: ["🍚", "🥛", "🍎", "🥦", "☕"] },           // אורז, חלב, פרי, ירק, שתייה
  { label: "טיפוח ותרופות", items: ["💊", "🩹", "🪥", "🧴", "🪒"] }, // תרופה, פצע, שיניים, שיער/עור, גילוח
  { label: "ניקיון", items: ["🧻", "🧽", "🧹", "🧺", "🗑️"] },        // נייר, כלים, רצפה, כביסה, פסולת
  { label: "בית", items: ["🛋️", "💡", "🪴", "🔨", "🕯️"] },          // רהיט, תאורה, צמח, כלי עבודה, נר
  { label: "כללי", items: ["🛒", "🎁", "🔋", "🐾", "✏️"] },          // שונות, מתנה, אלקטרוניקה, חיות, כתיבה
];

// אייקונים לעולם המטלות — 5 מכל קטגוריה
const TASK_EMOJIS = [
  { label: "ניקיון", items: ["🧽", "🧹", "🚿", "🪣", "🧴"] },
  { label: "כביסה", items: ["🧺", "👕", "🧦", "👖", "🧼"] },
  { label: "סידור", items: ["🛋️", "🛏️", "📦", "🗂️", "🚪"] },
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

// רקע המערכת.
// לפרודקשן: שמור את background.jpg תחת public/ והחלף את BG_URL ל-"/background.jpg".
// כאן מוטמעת גרסה דחוסה כדי שהתצוגה תרנדר את הרקע האמיתי.
const BG_URL = "data:image/jpeg;base64,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";

/* --------------------------- FLIP hook ---------------------------- *
 * נותן ref-callback לכל פריט; בכל render שמשנה מיקום, הפריטים מחליקים
 * למקום החדש שלהם (reorder), נכנסים ב-fade+slide, ומחליפים מקום בחלקות.
 * ----------------------------------------------------------------- */
function useFlip() {
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
    const els = nodes.current;
    const next = new Map();

    // pass 1 — נטרל טרנספורם קיים ומדוד מיקום טבעי (Last)
    els.forEach((node, id) => {
      node.style.transition = "none";
      node.style.transform = "none";
      next.set(id, node.getBoundingClientRect());
    });

    // pass 2 — Invert + Play
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
      } else {
        // כניסה — fade + slide
        node.style.opacity = "0";
        node.style.transform = "translateY(10px) scale(0.985)";
        node.getBoundingClientRect();
        node.style.transition =
          "transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease";
        node.style.opacity = "1";
        node.style.transform = "none";
      }
    });

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
  if (bought) return glass({ background: "rgba(255,255,255,0.34)", opacity: 0.72 });
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

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: p.bg, color: p.text, border: `1px solid ${p.border}`, backdropFilter: "blur(6px)" }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 99, background: p.dot, boxShadow: `0 0 6px ${p.dot}` }} />
      {p.label}
    </span>
  );
}

/* תג שיוך (אביב / יוסי) — עיגול צבעוני עם השם */
function AssigneeChip({ who }) {
  const color = WHO_COLORS[who] || "#6b7280";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      <span
        className="grid place-items-center rounded-full text-white"
        style={{ width: 15, height: 15, fontSize: who === "כולם" ? 9 : 9, background: color }}
      >
        {who === "כולם" ? "👥" : who?.[0]}
      </span>
      {who}
    </span>
  );
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

/* כרטיס פריט קומפקטי — פריסה אופקית, גובה נמוך */
function ItemCard({ item, registerRef, onToggle, onEdit, removing }) {
  const bought = item.status === "done";
  return (
    <div
      ref={registerRef}
      style={{
        // removing -> כיווץ + דעיכה לפני הסרה
        maxHeight: removing ? 0 : 200,
        opacity: removing ? 0 : 1,
        marginBottom: removing ? 0 : 8,
        transform: removing ? "scale(0.96)" : "none",
        transition: "max-height 260ms ease, opacity 220ms ease, margin 260ms ease, transform 220ms ease",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => onEdit(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(item)}
        className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2 cursor-pointer transition-transform active:scale-[0.99]"
        style={cardStyle(item.priority, bought)}
      >
        {/* ימין: אייקון הפריט */}
        <div
          className="shrink-0 grid place-items-center rounded-xl text-xl"
          style={{ width: 40, height: 40, ...glass({ background: "rgba(255,255,255,0.45)" }) }}
        >
          {item.emoji}
        </div>

        {/* אמצע: שם + מטא בשורה אחת קטנה */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold text-[15px] leading-tight truncate"
              style={{ color: bought ? "#7b8a82" : "#2b3a33", textDecoration: bought ? "line-through" : "none" }}
            >
              {item.name}
            </span>
            {item.note?.trim() && (
              <span title="יש הערה" className="shrink-0 text-[12px] opacity-70">📝</span>
            )}
          </div>
          <div className="text-[11px] text-stone-500 truncate mt-0.5">
            {item.category} · {item.type} · עודכן {item.updated}
          </div>
        </div>

        {/* שמאל: תג חשיבות + שיוך */}
        {(!bought || item.who) && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            {!bought && <PriorityBadge priority={item.priority} />}
            {item.who && <AssigneeChip who={item.who} />}
          </div>
        )}

        {/* קצה שמאל: checkbox לסימון (עוצר את לחיצת הכרטיס) */}
        <Checkbox
          checked={bought}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
          }}
        />
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
function Sheet({ open, title, onClose, children }) {
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
        className="w-full max-w-[400px] rounded-t-3xl px-5 pt-3 pb-7"
        style={{
          ...glass({ background: "rgba(248,250,248,0.85)" }),
          transform: open ? `translateY(${Math.max(dragY, 0)}px)` : "translateY(102%)",
          transition: dragging ? "none" : "transform 340ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* אזור אחיזה לגרירה — הידית והכותרת */}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: "none", cursor: "grab" }}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: "rgba(120,140,130,0.45)" }} />
          <h3 className="text-center font-bold text-stone-700 mb-4 select-none">{title}</h3>
        </div>
        {children}
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
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="בחר אייקון"
          className="shrink-0 grid place-items-center rounded-2xl text-xl transition-transform active:scale-90"
          style={{
            width: 48, height: 44,
            ...glass({ background: "rgba(255,255,255,0.5)" }),
            outline: open ? "2px solid rgba(74,150,110,0.7)" : "none",
          }}
        >
          {emoji}
        </button>
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

/* ----------------------------- אפליקציה --------------------------- */

export default function ShoppingList() {
  const [items, setItems] = useState(seedItems);
  const [tab, setTab] = useState("shopping");
  const [dir, setDir] = useState(0); // כיוון מעבר הטאב: 1 / -1
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [completedOpen, setCompletedOpen] = useState({});
  const [removing, setRemoving] = useState(new Set());

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ type: null, categories: [], priority: null, status: "all", who: [] });

  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", emoji: "🛒", category: "אוכל", type: "משתנים", priority: "medium", note: "", who: null });

  const cfg = TABS.find((t) => t.key === tab);
  const register = useFlip();

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

  /* ---- פעולות ---- */
  const toggle = (id) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: it.status === "active" ? "done" : "active", updated: "21.06.26" }
          : it
      )
    );

  const remove = (id) => {
    setRemoving((s) => new Set(s).add(id));
    setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 260);
    setEditing(null);
  };

  const updateEditing = (patch) => {
    if (!editing) return;
    setItems((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...patch, updated: "21.06.26" } : it)));
    setEditing((e) => (e ? { ...e, ...patch } : e));
  };

  const addItem = () => {
    if (!draft.name.trim()) return;
    const id = "n" + Date.now();
    setItems((prev) => [{ ...draft, id, kind: tab, status: "active", updated: "21.06.26" }, ...prev]);
    setAddOpen(false);
  };

  const openAdd = () => {
    setDraft({
      name: "", emoji: cfg.defaultEmoji, category: cfg.defaultCategory,
      type: "משתנים", priority: "medium", note: "",
      who: cfg.assignees ? cfg.assignees[0] : null,
    });
    setAddOpen(true);
  };

  const groupIcon = (t) => (t === "קבועים" ? "🔁" : "🛍️");

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
                open={groupOpen}
                onToggle={() =>
                  setCollapsedGroups((p) => ({ ...p, [g.type]: !p[g.type] }))
                }
              />

              <Collapsible open={groupOpen}>
                {/* פעילים */}
                {g.active.map((it) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    registerRef={register(it.id)}
                    onToggle={toggle}
                    onEdit={setEditing}
                    removing={removing.has(it.id)}
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
                        onToggle={() => setCompletedOpen((p) => ({ ...p, [g.type]: !p[g.type] }))}
                      />
                      <Collapsible open={boughtOpen}>
                        {g.bought.map((it) => (
                          <ItemCard
                            key={it.id}
                            item={it}
                            registerRef={register(it.id)}
                            onToggle={toggle}
                            onEdit={setEditing}
                            removing={removing.has(it.id)}
                          />
                        ))}
                      </Collapsible>
                    </>
                  ) : (
                    g.bought.map((it) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        registerRef={register(it.id)}
                        onToggle={toggle}
                        onEdit={setEditing}
                        removing={removing.has(it.id)}
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
      <Sheet open={!!editing} title={editing ? `עריכת ${editing.name}` : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-4">
            <IconField
              emoji={editing.emoji}
              name={editing.name}
              onEmoji={(emoji) => updateEditing({ emoji })}
              onName={(name) => updateEditing({ name })}
              groups={cfg.emojiGroups}
              placeholder={`שם ${cfg.word === "פריט" ? "הפריט" : "המשימה"}`}
            />
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">סוג</div>
              <Pills options={TYPES} value={editing.type} onChange={(v) => v && updateEditing({ type: v })} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">קטגוריה</div>
              <Pills options={cfg.categories} value={editing.category} onChange={(v) => v && updateEditing({ category: v })} />
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
                rows={3}
                className="w-full rounded-2xl px-3 py-2 outline-none text-[14px] text-stone-700 placeholder:text-stone-400 resize-none"
                style={glass({ background: "rgba(255,255,255,0.5)" })}
              />
            </div>
            <button
              onClick={() => remove(editing.id)}
              className="w-full rounded-2xl h-11 font-bold"
              style={{ background: "rgba(255,99,99,0.15)", color: "#b42318", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              מחק {cfg.word}
            </button>
          </div>
        )}
      </Sheet>

      {/* Sheet — הוספה */}
      <Sheet open={addOpen} title={`הוספת ${cfg.word}`} onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          <IconField
            emoji={draft.emoji}
            name={draft.name}
            onEmoji={(emoji) => setDraft((d) => ({ ...d, emoji }))}
            onName={(name) => setDraft((d) => ({ ...d, name }))}
            groups={cfg.emojiGroups}
            placeholder={`שם ${cfg.word === "פריט" ? "הפריט" : "המשימה"}`}
          />
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">סוג</div>
            <Pills options={TYPES} value={draft.type} onChange={(v) => v && setDraft((d) => ({ ...d, type: v }))} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-stone-500 mb-2">קטגוריה</div>
            <Pills options={cfg.categories} value={draft.category} onChange={(v) => v && setDraft((d) => ({ ...d, category: v }))} />
          </div>
          {cfg.assignees && (
            <div>
              <div className="text-[12px] font-semibold text-stone-500 mb-2">אחראי</div>
              <Pills options={cfg.assignees} value={draft.who} onChange={(v) => v && setDraft((d) => ({ ...d, who: v }))} />
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
              rows={3}
              className="w-full rounded-2xl px-3 py-2 outline-none text-[14px] text-stone-700 placeholder:text-stone-400 resize-none"
              style={glass({ background: "rgba(255,255,255,0.5)" })}
            />
          </div>
          <button onClick={addItem} className="w-full rounded-2xl h-11 font-bold text-white" style={{ background: "linear-gradient(180deg,#4ea27a,#3c7f5f)" }}>
            הוסף לרשימה
          </button>
        </div>
      </Sheet>
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
