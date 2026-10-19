create extension if not exists citext;

create table if not exists waitlist (
  id bigserial primary key,
  email citext not null unique,
  consent boolean not null default false,
  source text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
