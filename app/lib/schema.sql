-- Run this to set up the database schema

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'adm',
    'comite_central',
    'uniao_comite_local',
    'comite_local',
    'base'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    user_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- Many-to-many: links a uniao_comite_local user to comite_local users it oversees
CREATE TABLE IF NOT EXISTS uniao_comite_local_members (
  uniao_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comite_local_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (uniao_id, comite_local_id)
);

-- Núcleos are created by comite_local users
CREATE TABLE IF NOT EXISTS nucleos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members of a núcleo (base users)
CREATE TABLE IF NOT EXISTS nucleo_members (
  nucleo_id UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (nucleo_id, user_id)
);

-- Kanban boards belong to a núcleo
CREATE TABLE IF NOT EXISTS kanban_boards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id  UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE kanban_column AS ENUM ('a_fazer', 'em_andamento', 'concluido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Cards inside a board
CREATE TABLE IF NOT EXISTS kanban_cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  card_column kanban_column NOT NULL DEFAULT 'a_fazer',
  title       TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM (
    'diaria',
    'semanal',
    'quinzenal',
    'mensal',
    'anual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recurring activities belong to a núcleo
CREATE TABLE IF NOT EXISTS recurring_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id   UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  recurrence  recurrence_type NOT NULL,
  start_date  DATE NOT NULL,
  next_date   DATE NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
