// supabase/functions/customer-check/index.ts
// 部署指令：supabase functions deploy customer-check
//
// 功能：客戶勾選 checklist 項目，寫入 project_progress 並記錄 log
// 安全機制：
//   1. 驗證 session token（只有登入的客戶能呼叫）
//   2. 確認 hotel_id 歸屬（不能改其他飯店的資料）
//   3. item_key 白名單（不能改非 checklist 的欄位）
//   4. updated_at 樂觀鎖（防止過期請求覆蓋較新的資料）

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── checklist 白名單 ─────────────────────────────────────────
// section → field in project_progress → allowed item keys
const WHITELIST: Record<string, { field: string; keys: string[] }> = {
  basic: {
    field: "basic_checked",
    keys: [
      "房型及機台擺放位置圖片",
      "需申請後台權限的 email 帳號",
      "樓層房號表及 WiFi 資訊",
      "機台重啟（Check out）方式",
      "是否需開啟打掃 & 勿擾功能",
      "通話快捷鍵設定 & 分機提供",
      "歡迎畫面背景",
      "歡迎詞填寫",
      "後台服務功能設定 & 送物 / 修繕項目清單",
      "TMS Pro 設定",
      "轉接情境與歡迎詞設定", // ACA_ITEM，也存在 basic_checked
    ],
  },
  faq: {
    field: "faq_checked",
    keys: [
      "飯店基本資訊",
      "飯店內設施",
      "飯店提供之服務",
      "入住規則",
      "備品清單",
      "電視頻道設定（若串接項目不含 IPTV 則不用填寫）",
      "特別推薦美食景點",
    ],
  },
  batch2: {
    field: "batch2_checked",
    keys: [
      "機台 Showcase 設定",
      "廣告設定",
      "Pop-up QR code 內容設定",
      "GuestWeb 內容建置",
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  // ── 1. 驗證 session token ────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "missing authorization" }, 401);
  }
  const token = authHeader.slice(7);

  // 用 service key 初始化，再用 token 取得使用者身份
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: userErr } = await sb.auth.getUser(token);

  if (userErr || !user?.email) {
    return json({ error: "invalid session" }, 401);
  }
  const email = user.email;

  // ── 2. 解析 request body ─────────────────────────────────
  let project_id: string, item_key: string, section: string,
      checked: boolean, client_updated_at: string;
  try {
    ({ project_id, item_key, section, checked, client_updated_at } = await req.json());
  } catch {
    return json({ error: "invalid request body" }, 400);
  }

  if (!project_id || !item_key || !section || checked === undefined) {
    return json({ error: "missing required fields" }, 400);
  }

  // ── 3. 確認 section + item_key 在白名單內 ───────────────
  const wl = WHITELIST[section];
  if (!wl || !wl.keys.includes(item_key)) {
    return json({ error: "item_key not allowed" }, 403);
  }

  // ── 4. 確認 project 屬於這個 email 的 hotel_id ──────────
  const { data: project, error: projErr } = await sb
    .from("projects")
    .select("id, hotel_id")
    .eq("id", project_id)
    .maybeSingle();

  if (projErr || !project) {
    return json({ error: "project not found" }, 404);
  }

  const { data: access } = await sb
    .from("customer_access")
    .select("id")
    .eq("email",    email)
    .eq("hotel_id", project.hotel_id)
    .maybeSingle();

  if (!access) {
    return json({ error: "forbidden" }, 403);
  }

  // ── 5. 樂觀鎖：比對 updated_at ──────────────────────────
  const { data: progress, error: progErr } = await sb
    .from("project_progress")
    .select(`${wl.field}, updated_at`)
    .eq("project_id", project_id)
    .maybeSingle();

  if (progErr) {
    return json({ error: "internal error" }, 500);
  }

  if (progress && client_updated_at) {
    const dbTime     = new Date(progress.updated_at).getTime();
    const clientTime = new Date(client_updated_at).getTime();
    if (clientTime < dbTime) {
      return json({ error: "conflict", updated_at: progress.updated_at }, 409);
    }
  }

  // ── 6. 更新 project_progress ────────────────────────────
  const currentChecked = (progress?.[wl.field] as Record<string, boolean>) ?? {};
  const newChecked = { ...currentChecked, [item_key]: checked };

  const { error: upsertErr } = await sb
    .from("project_progress")
    .upsert(
      { project_id, [wl.field]: newChecked },
      { onConflict: "project_id" }
    );

  if (upsertErr) {
    console.error("upsert error:", upsertErr);
    return json({ error: "failed to save" }, 500);
  }

  // ── 7. 寫入 audit log ────────────────────────────────────
  await sb.from("customer_checklist_log").insert({
    project_id,
    email,
    item_key,
    section,
    checked,
  });

  // ── 8. 寫入 notification（觸發內部 bell icon）────────────
  await sb.from("notifications").insert({
    type:       "customer_check",
    project_id,
    payload: {
      item_key,
      section,
      checked,
      email,
      hotel_id: project.hotel_id,
    },
  });

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
