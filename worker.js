/**
 * Cloudflare Worker — מגיש את האפליקציה וגם מספק API משותף לסנכרון.
 *
 * נתיבים:
 *   GET  /api/items  -> מחזיר { items: [...] } מתוך KV (או { items: null } אם ריק)
 *   PUT  /api/items  -> מקבל { items: [...] } ושומר ב-KV (כתיבה אחרונה מנצחת)
 *   כל שאר הנתיבים    -> קבצים סטטיים (index.html, app.js) דרך binding בשם ASSETS
 *
 * דורש:
 *   - KV namespace עם binding בשם LIST_KV
 *   - תיקיית assets (public/) עם binding בשם ASSETS
 *   (מוגדרים ב-wrangler.jsonc)
 */

const KEY = "list";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/items") {
      if (request.method === "OPTIONS") return json({ ok: true });

      if (request.method === "GET") {
        const raw = await env.LIST_KV.get(KEY);
        return json(raw ? JSON.parse(raw) : { items: null });
      }

      if (request.method === "PUT") {
        let body = null;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid json" }, 400);
        }
        if (!body || !Array.isArray(body.items)) {
          return json({ error: "items must be an array" }, 400);
        }
        await env.LIST_KV.put(KEY, JSON.stringify({ items: body.items }));
        return json({ ok: true });
      }

      return json({ error: "method not allowed" }, 405);
    }

    // כל השאר — קבצים סטטיים
    return env.ASSETS.fetch(request);
  },
};
