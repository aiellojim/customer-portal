// supabase/functions/customer-auth/index.ts
// 部署指令：supabase functions deploy customer-auth
//
// 功能：驗證 email + hotel_id 配對，通過後發送 Magic Link
// 呼叫方：客戶端登入頁

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY   = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL            = Deno.env.get("CUSTOMER_SITE_URL")!; // 客戶端 Vercel URL

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  // ── 1. 解析請求 ─────────────────────────────────────────────
  let email: string, hotel_id: string;
  try {
    ({ email, hotel_id } = await req.json());
  } catch {
    return json({ error: "invalid request body" }, 400);
  }

  if (!email || !hotel_id) {
    return json({ error: "email and hotel_id are required" }, 400);
  }

  const normalizedEmail   = email.trim().toLowerCase();
  const normalizedHotelId = hotel_id.trim();

  // ── 2. 用 anon key 查詢 customer_access（RLS 外層再驗一次）──
  //    改用 service key 避免 RLS 阻擋查詢
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: access, error: accessErr } = await sb
    .from("customer_access")
    .select("id")
    .eq("email",    normalizedEmail)
    .eq("hotel_id", normalizedHotelId)
    .maybeSingle();

  if (accessErr) {
    console.error("customer_access query error:", accessErr);
    return json({ error: "internal error" }, 500);
  }

  // 配對失敗：回傳 403，不發信，不透露具體原因（防列舉）
  if (!access) {
    return json({ error: "unauthorized" }, 403);
  }

  // ── 3. 發送 Magic Link ──────────────────────────────────────
  const { error: linkErr } = await sb.auth.admin.generateLink({
    type:  "magiclink",
    email: normalizedEmail,
    options: {
      redirectTo: `${SITE_URL}/dashboard`,
    },
  });

  if (linkErr) {
    console.error("generateLink error:", linkErr);
    return json({ error: "failed to send magic link" }, 500);
  }

  // 成功：只告訴前端「請檢查信箱」，不暴露任何配對細節
  return json({ ok: true });
});

// ── helpers ─────────────────────────────────────────────────
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
