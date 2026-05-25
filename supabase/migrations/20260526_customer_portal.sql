-- ============================================================
-- Customer Portal Schema
-- Migration: 20260526_customer_portal
-- ============================================================

-- 1. customer_access
--    一個 hotel_id 可對應多個 email（一對多）
-- ------------------------------------------------------------
create table if not exists customer_access (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    text not null,
  email       text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint  uq_customer_access unique (hotel_id, email)
);

alter table customer_access enable row level security;

-- 客戶只能看到自己 email 的那幾筆
create policy "customer: read own access"
  on customer_access for select
  using (email = auth.email());

-- 只有 service_role（Edge Function）可以寫入
-- PM 透過 Edge Function 新增，前端不能直接 insert


-- 2. customer_checklist_log
--    記錄每次客戶勾選 / 取消勾選的操作（audit trail）
-- ------------------------------------------------------------
create table if not exists customer_checklist_log (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  email       text not null,
  item_key    text not null,
  section     text not null,  -- 'basic' | 'faq' | 'aca' | 'batch2'
  checked     boolean not null,
  created_at  timestamptz not null default now()
);

alter table customer_checklist_log enable row level security;
-- 只有 service_role 可讀寫（PM 透過內部儀表查詢）


-- 3. notifications
--    Bell icon 通知來源（客戶勾選時由 Edge Function 寫入）
-- ------------------------------------------------------------
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'customer_check',
  project_id  uuid references projects(id) on delete cascade,
  payload     jsonb not null default '{}',
  -- payload 範例: { "item_key": "備品清單", "section": "faq",
  --                 "checked": true, "email": "client@hotel.com" }
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

-- 內部 PM（authenticated）可讀、可標記已讀
create policy "internal: read notifications"
  on notifications for select
  to authenticated
  using (true);

create policy "internal: update read flag"
  on notifications for update
  to authenticated
  using (true)
  with check (true);


-- 4. tasks 表加 is_internal 欄位
-- ------------------------------------------------------------
alter table tasks
  add column if not exists is_internal boolean not null default true;


-- 5. RLS: projects — 客戶只能看到自己 hotel_id 的專案
-- ------------------------------------------------------------
create policy "customer: read own project"
  on projects for select
  using (
    hotel_id in (
      select hotel_id
      from   customer_access
      where  email = auth.email()
    )
  );


-- 6. RLS: project_progress — 跟著 projects 走
-- ------------------------------------------------------------
create policy "customer: read own progress"
  on project_progress for select
  using (
    project_id in (
      select p.id
      from   projects p
      join   customer_access ca on ca.hotel_id = p.hotel_id
      where  ca.email = auth.email()
    )
  );


-- 7. RLS: tasks — 客戶只能看 is_internal = false 且屬於自己飯店的任務
-- ------------------------------------------------------------
create policy "customer: read own public tasks"
  on tasks for select
  using (
    is_internal = false
    and project_id in (
      select p.id
      from   projects p
      join   customer_access ca on ca.hotel_id = p.hotel_id
      where  ca.email = auth.email()
    )
  );
