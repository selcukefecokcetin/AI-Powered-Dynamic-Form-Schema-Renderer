-- =========================================================
-- AI Powered Dynamic Form Schema Renderer
-- Supabase PostgreSQL Schema
-- =========================================================

-- ---------------------------------------------------------
-- FORMS
-- ---------------------------------------------------------

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),

  -- Authentication eklendiğinde kullanılacak.
  owner_id uuid null
    references auth.users(id)
    on delete cascade,

  original_prompt text,

  form_title text not null,

  schema_json jsonb not null,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'published'
      )
    ),

  public_token uuid unique,

  version integer not null default 1
    check (version >= 1),

  published_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
  forms_status_idx
on public.forms(status);

create index if not exists
  forms_created_at_idx
on public.forms(created_at desc);

create index if not exists
  forms_public_token_idx
on public.forms(public_token);

alter table public.forms
enable row level security;


-- ---------------------------------------------------------
-- SUBMISSIONS
-- ---------------------------------------------------------

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),

  form_id uuid not null
    references public.forms(id)
    on delete cascade,

  form_version integer not null
    check (form_version >= 1),

  -- Form daha sonra değişse bile submission'ın
  -- hangi schema ile gönderildiğini korur.
  schema_snapshot jsonb not null,

  payload_json jsonb not null,

  submitted_at timestamptz not null
    default now()
);

create index if not exists
  submissions_form_id_idx
on public.submissions(form_id);

create index if not exists
  submissions_submitted_at_idx
on public.submissions(submitted_at desc);

alter table public.submissions
enable row level security;