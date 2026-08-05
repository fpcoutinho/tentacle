-- Up Migration

-- O que hoje se chama "trails" é, na verdade, o nível dentro de uma trilha
-- (ex.: "Nível 1 — Fundamentos"). Renomeia para levels e cria uma tabela
-- trails de verdade acima dela.

ALTER TABLE trails RENAME TO levels;
ALTER TABLE levels RENAME CONSTRAINT trails_pkey TO levels_pkey;
ALTER TABLE levels RENAME CONSTRAINT trails_slug_key TO levels_slug_key;
ALTER SEQUENCE trails_id_seq RENAME TO levels_id_seq;

ALTER TABLE missions RENAME COLUMN trail_id TO level_id;
ALTER TABLE missions RENAME CONSTRAINT missions_trail_id_fkey TO missions_level_id_fkey;
ALTER TABLE missions RENAME CONSTRAINT missions_trail_id_order_index_key TO missions_level_id_order_index_key;

CREATE TABLE trails (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  subtitle    text NOT NULL,
  short_title text NOT NULL,
  order_index integer NOT NULL UNIQUE
);

ALTER TABLE levels ADD COLUMN trail_id integer REFERENCES trails(id) ON DELETE CASCADE;

INSERT INTO trails (slug, title, subtitle, short_title, order_index)
SELECT 'poo', 'Trilha POO', 'Programação Orientada a Objetos em Python', 'POO', 1
WHERE EXISTS (SELECT 1 FROM levels);

UPDATE levels SET trail_id = (SELECT id FROM trails WHERE slug = 'poo');

ALTER TABLE levels ALTER COLUMN trail_id SET NOT NULL;

-- order_index de nível era globalmente único; passa a ser único por trilha.
ALTER TABLE levels DROP CONSTRAINT trails_order_index_key;
ALTER TABLE levels ADD CONSTRAINT levels_trail_id_order_index_key UNIQUE (trail_id, order_index);

-- Down Migration

ALTER TABLE levels DROP CONSTRAINT levels_trail_id_order_index_key;
ALTER TABLE levels ADD CONSTRAINT trails_order_index_key UNIQUE (order_index);

ALTER TABLE levels DROP COLUMN trail_id;

DROP TABLE trails;

ALTER TABLE missions RENAME CONSTRAINT missions_level_id_order_index_key TO missions_trail_id_order_index_key;
ALTER TABLE missions RENAME CONSTRAINT missions_level_id_fkey TO missions_trail_id_fkey;
ALTER TABLE missions RENAME COLUMN level_id TO trail_id;

ALTER SEQUENCE levels_id_seq RENAME TO trails_id_seq;
ALTER TABLE levels RENAME CONSTRAINT levels_slug_key TO trails_slug_key;
ALTER TABLE levels RENAME CONSTRAINT levels_pkey TO trails_pkey;
ALTER TABLE levels RENAME TO trails;
