-- 銘文組合：玩家數值參考
-- 圖片檔案請放在網站：/mo_data/pic/rune_combo/
-- 例如 image_name = 'b-01.png'

create table if not exists public.rune_combo_references (
  id uuid primary key default gen_random_uuid(),

  -- 對應 rune-combo.html 的 data-combo-key
  combo_key text not null
    check (combo_key in ('combo-a', 'combo-b', 'combo-hp', 'combo-hp-high')),

  -- 圖片檔名，不儲存完整 URL
  -- 例如：b-01.png、20000hp-01.jpg
  image_name text not null
    check (
      length(trim(image_name)) > 0
      and image_name !~ E'[/\\\\]'
      and image_name ~* E'\\.(png|jpe?g|webp|gif)$'
    ),

  -- 固定由資料表產生圖片位置
  image_url text generated always as (
    '/mo_data/pic/rune_combo/' || image_name
  ) stored,

  -- 顯示在圖片上方或下方的標題
  image_title text,

  -- 提供者與圖片補充說明
  provider_name text,
  condition_text text,
  note text,

  -- 同一組合內的顯示順序
  sort_id integer not null default 1
    check (sort_id >= 1),

  -- 只有 approved 會顯示在前端
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.rune_combo_references is
  '銘文組合的玩家數值參考圖片';
comment on column public.rune_combo_references.combo_key is
  '對應 rune-combo.html 的組合卡片 key';
comment on column public.rune_combo_references.image_name is
  '放在 /mo_data/pic/rune_combo/ 下的圖片檔名';
comment on column public.rune_combo_references.image_url is
  '由 image_name 自動組合的固定圖片路徑';

create index if not exists rune_combo_references_combo_idx
  on public.rune_combo_references (combo_key, status, sort_id);

-- 自動更新 updated_at
create or replace function public.set_rune_combo_references_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rune_combo_references_updated_at
  on public.rune_combo_references;

create trigger trg_rune_combo_references_updated_at
before update on public.rune_combo_references
for each row
execute function public.set_rune_combo_references_updated_at();

-- 啟用 Row Level Security
alter table public.rune_combo_references enable row level security;

-- 前端（匿名訪客與已登入者）只能讀取已核准資料。
drop policy if exists "rune combo references public read" 
  on public.rune_combo_references;
create policy "rune combo references public read"
  on public.rune_combo_references
  for select
  to anon, authenticated
  using (status = 'approved');

-- 後台登入者可查看所有狀態，供 admin.html 管理。
drop policy if exists "rune combo references authenticated read all"
  on public.rune_combo_references;
create policy "rune combo references authenticated read all"
  on public.rune_combo_references
  for select
  to authenticated
  using (true);

-- 只有 Supabase Auth 已登入者可以新增、修改、刪除。
drop policy if exists "rune combo references authenticated insert"
  on public.rune_combo_references;
create policy "rune combo references authenticated insert"
  on public.rune_combo_references
  for insert
  to authenticated
  with check (true);

drop policy if exists "rune combo references authenticated update"
  on public.rune_combo_references;
create policy "rune combo references authenticated update"
  on public.rune_combo_references
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "rune combo references authenticated delete"
  on public.rune_combo_references;
create policy "rune combo references authenticated delete"
  on public.rune_combo_references
  for delete
  to authenticated
  using (true);

