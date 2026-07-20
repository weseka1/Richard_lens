-- RICHARD LENS — Schema Supabase (pegar entero en SQL Editor del proyecto)
-- Tablas: productos, variantes, pedidos, suscriptores, eventos + RLS.

create table if not exists productos (
  id text primary key,
  marca text not null,
  modelo text not null,
  codigo text,
  color text,
  cristal text,
  forma text,
  material text,
  genero text default 'unisex',
  precio_web integer default 0,
  precio_ml integer default 0,
  stock integer default 0,
  costo_usd numeric default 0,
  canal text default 'WEB',
  estado text default 'a_pedido',
  destacado boolean default false,
  descripcion text,
  foto_codigo text,
  meli_item_id text,
  meli_permalink text,
  creado timestamptz default now(),
  actualizado timestamptz default now()
);

create table if not exists variantes (
  sku text primary key,
  producto_id text references productos(id) on delete cascade,
  codigo text,
  color text,
  talle text,
  stock text default 'CONSULTAR',   -- STOCK | POCO STOCK | POR ENTRAR | CONSULTAR
  actualizado timestamptz default now()
);
create index if not exists variantes_producto on variantes(producto_id);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz default now(),
  producto text,
  cantidad integer default 1,
  monto integer default 0,
  canal text default 'web',
  cliente text,
  estado text default 'nuevo',      -- nuevo|senado|pagado|enviado|entregado|caido
  meli_order_id text,
  detalle jsonb
);

create table if not exists suscriptores (
  email text primary key,
  fecha timestamptz default now(),
  origen text default 'web'
);

create table if not exists eventos (
  id bigint generated always as identity primary key,
  fecha timestamptz default now(),
  tipo text,
  detalle text
);
create index if not exists eventos_tipo on eventos(tipo);

-- ===== RLS: lectura pública del catálogo; escrituras públicas SOLO altas controladas =====
alter table productos enable row level security;
alter table variantes enable row level security;
alter table pedidos enable row level security;
alter table suscriptores enable row level security;
alter table eventos enable row level security;

create policy "catalogo publico" on productos for select using (estado <> 'pausado');
create policy "variantes publicas" on variantes for select using (true);
create policy "alta pedido web" on pedidos for insert with check (true);
create policy "alta suscriptor" on suscriptores for insert with check (true);
create policy "alta evento" on eventos for insert with check (true);
-- lecturas/updates de pedidos, suscriptores y eventos: SOLO service_role (el panel pasa por el server)
