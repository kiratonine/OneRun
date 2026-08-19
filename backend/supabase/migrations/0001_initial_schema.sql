create extension if not exists pgcrypto;

create table if not exists settlements (
  id serial primary key,
  code text unique not null,
  name_ru text not null,
  name_kz text,
  district text,
  lat double precision not null,
  lon double precision not null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  from_id int references settlements(id) not null,
  to_id int references settlements(id) not null,
  shipper_name text not null,
  cargo_name text not null,
  weight_kg numeric not null,
  boxes_count int,
  box_note text,
  color text not null,
  status text not null default 'new',
  created_at timestamptz default now()
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'planned',
  stop_order jsonb not null,
  route_geometry jsonb not null,
  total_distance_km numeric not null,
  solo_distance_km numeric not null,
  saved_distance_km numeric not null,
  saved_cost_kzt numeric not null,
  total_weight_kg numeric not null,
  created_at timestamptz default now()
);

create table if not exists trip_orders (
  trip_id uuid references trips(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  price_kzt numeric not null,
  load_position int not null,
  drop_index int not null,
  leg_distance_km numeric not null,
  primary key (trip_id, order_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  content_md text not null,
  raw_response jsonb,
  source text not null default 'mock',
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end
$$;
