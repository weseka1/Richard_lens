-- Migración aplicada en Supabase (proyecto jkkytzgmhzzngnntkfbr) el 2026-07.
-- Variantes estilo MercadoLibre: color por parte (marco / lente / varilla).
-- Registrada acá para versionar el cambio de base (se aplicó vía MCP apply_migration).

ALTER TABLE rl_variantes
  ADD COLUMN IF NOT EXISTS color_marco   text,
  ADD COLUMN IF NOT EXISTS color_lente   text,
  ADD COLUMN IF NOT EXISTS color_varilla text;

-- Reemplaza el SET completo de variantes de un producto (borra las que ya no están e
-- inserta las nuevas). Ignora filas sin color. Autogenera SKU si falta. SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.rl_admin_set_variantes(p_id text, filas jsonb, clave text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare n integer := 0; f jsonb;
begin
  if clave <> 'de8c94cf579941f682bc3e89cc282d27' then raise exception 'clave invalida'; end if;
  delete from rl_variantes where producto_id = p_id;
  for f in select * from jsonb_array_elements(coalesce(filas, '[]'::jsonb)) loop
    if coalesce(trim(f->>'color'), '') = '' then continue; end if;
    insert into rl_variantes (sku, producto_id, codigo, color, color_marco, color_lente, color_varilla, talle, stock)
    values (
      coalesce(nullif(trim(f->>'sku'), ''), p_id || '-' || (n + 1)),
      p_id, f->>'codigo', trim(f->>'color'),
      nullif(trim(f->>'color_marco'), ''), nullif(trim(f->>'color_lente'), ''), nullif(trim(f->>'color_varilla'), ''),
      f->>'talle', coalesce(nullif(f->>'stock',''), 'CONSULTAR')
    )
    on conflict (sku) do update set producto_id=excluded.producto_id, codigo=excluded.codigo,
      color=excluded.color, color_marco=excluded.color_marco, color_lente=excluded.color_lente,
      color_varilla=excluded.color_varilla, talle=excluded.talle, stock=excluded.stock, actualizado=now();
    n := n + 1;
  end loop;
  return n;
end $function$;
