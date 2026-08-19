create or replace function persist_trip(
  p_trip jsonb,
  p_trip_orders jsonb,
  p_report jsonb,
  p_order_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid := (p_trip ->> 'id')::uuid;
begin
  insert into trips (
    id,
    code,
    stop_order,
    route_geometry,
    total_distance_km,
    solo_distance_km,
    saved_distance_km,
    saved_cost_kzt,
    total_weight_kg
  )
  values (
    v_trip_id,
    p_trip ->> 'code',
    p_trip -> 'stop_order',
    p_trip -> 'route_geometry',
    (p_trip ->> 'total_distance_km')::numeric,
    (p_trip ->> 'solo_distance_km')::numeric,
    (p_trip ->> 'saved_distance_km')::numeric,
    (p_trip ->> 'saved_cost_kzt')::numeric,
    (p_trip ->> 'total_weight_kg')::numeric
  );

  insert into trip_orders (
    trip_id,
    order_id,
    price_kzt,
    load_position,
    drop_index,
    leg_distance_km
  )
  select
    v_trip_id,
    (item ->> 'order_id')::uuid,
    (item ->> 'price_kzt')::numeric,
    (item ->> 'load_position')::int,
    (item ->> 'drop_index')::int,
    (item ->> 'leg_distance_km')::numeric
  from jsonb_array_elements(p_trip_orders) as item;

  insert into reports (trip_id, content_md, raw_response, source)
  values (
    v_trip_id,
    p_report ->> 'content_md',
    p_report -> 'raw_response',
    p_report ->> 'source'
  );

  update orders
  set status = 'routed'
  where id = any(p_order_ids) and status = 'new';

  return v_trip_id;
end;
$$;
