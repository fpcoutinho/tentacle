-- Up Migration

CREATE TABLE users (
  id            text PRIMARY KEY CHECK (length(id) > 0),
  name          text NOT NULL DEFAULT '',
  gender        text CHECK (gender IN ('male', 'female', 'other')),
  shell_balance integer NOT NULL DEFAULT 0 CHECK (shell_balance >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trails (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  short_title text NOT NULL,
  order_index integer NOT NULL UNIQUE
);

CREATE TABLE shop_items (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_type    text NOT NULL CHECK (item_type IN ('frame', 'accessory', 'color')),
  code         text NOT NULL,
  name         text NOT NULL,
  price_shells integer NOT NULL CHECK (price_shells >= 0),
  UNIQUE (item_type, code)
);

CREATE TABLE missions (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trail_id          integer NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL,
  emblem            text,
  theory            text NOT NULL,
  has_minigame      boolean NOT NULL DEFAULT false,
  summary           jsonb CHECK (jsonb_typeof(summary) = 'array'),
  bibliography      jsonb CHECK (jsonb_typeof(bibliography) = 'array'),
  faqs              jsonb CHECK (jsonb_typeof(faqs) = 'object'),
  order_index       integer NOT NULL,
  UNIQUE (trail_id, order_index)
);

CREATE TABLE mission_questions (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mission_id        integer NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  slug              text NOT NULL UNIQUE,
  kind              text NOT NULL CHECK (kind IN ('main', 'extra')),
  prompt            text NOT NULL,
  explanation       text NOT NULL,
  max_reward_shells integer NOT NULL CHECK (max_reward_shells > 0),
  order_index       integer NOT NULL,
  UNIQUE (mission_id, order_index)
);

CREATE UNIQUE INDEX mission_questions_one_main_per_mission
  ON mission_questions (mission_id) WHERE kind = 'main';

CREATE TABLE mission_question_options (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id       integer NOT NULL REFERENCES mission_questions(id) ON DELETE CASCADE,
  label             text NOT NULL,
  is_correct        boolean NOT NULL DEFAULT false,
  order_index       integer NOT NULL,
  wrong_explanation text,
  UNIQUE (question_id, order_index),
  UNIQUE (id, question_id)
);

CREATE UNIQUE INDEX mission_question_options_one_correct_per_question
  ON mission_question_options (question_id) WHERE is_correct = true;

CREATE TABLE user_mission_completions (
  user_id      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id   integer NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_id)
);

CREATE TABLE user_submissions (
  id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id      integer NOT NULL REFERENCES mission_questions(id) ON DELETE CASCADE,
  answer_option_id integer NOT NULL,
  attempt_number   integer NOT NULL CHECK (attempt_number > 0),
  is_correct       boolean NOT NULL,
  earned_shells    integer NOT NULL DEFAULT 0 CHECK (earned_shells >= 0),
  idempotency_key  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (answer_option_id, question_id)
    REFERENCES mission_question_options (id, question_id) ON DELETE CASCADE,
  UNIQUE (user_id, question_id, attempt_number)
);

CREATE UNIQUE INDEX user_submissions_one_correct_per_question
  ON user_submissions (user_id, question_id) WHERE is_correct = true;

CREATE UNIQUE INDEX user_submissions_idempotency_key_unique
  ON user_submissions (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE shell_ledger (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta          integer NOT NULL CHECK (delta <> 0),
  reason         text NOT NULL CHECK (reason IN ('mission_reward', 'exercise_reward', 'purchase')),
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after  integer NOT NULL CHECK (balance_after >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (balance_after = balance_before + delta)
);

CREATE TABLE user_inventory (
  id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id            text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id            integer NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  acquisition_reason text NOT NULL DEFAULT 'purchase',
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

CREATE TABLE user_avatar_settings (
  user_id          text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_idx       integer NOT NULL DEFAULT 0 CHECK (avatar_idx >= 0),
  active_frame     integer,
  active_accessory integer,
  active_color     integer,
  FOREIGN KEY (user_id, active_frame)     REFERENCES user_inventory (user_id, item_id)
    ON DELETE SET NULL (active_frame),
  FOREIGN KEY (user_id, active_accessory) REFERENCES user_inventory (user_id, item_id)
    ON DELETE SET NULL (active_accessory),
  FOREIGN KEY (user_id, active_color)     REFERENCES user_inventory (user_id, item_id)
    ON DELETE SET NULL (active_color)
);

CREATE TABLE bookmarks (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id integer NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  data       jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_id)
);

-- Índices de FK não cobertos pelos UNIQUE compostos acima
CREATE INDEX user_submissions_answer_option_id_idx ON user_submissions (answer_option_id);
CREATE INDEX user_submissions_question_id_idx       ON user_submissions (question_id);
CREATE INDEX shell_ledger_user_id_idx             ON shell_ledger (user_id);
CREATE INDEX user_inventory_item_id_idx           ON user_inventory (item_id);
CREATE INDEX bookmarks_mission_id_idx             ON bookmarks (mission_id);
CREATE INDEX user_mission_completions_mission_idx ON user_mission_completions (mission_id);

-- Down Migration

DROP TABLE bookmarks;
DROP TABLE user_avatar_settings;
DROP TABLE user_inventory;
DROP TABLE shell_ledger;
DROP TABLE user_submissions;
DROP TABLE user_mission_completions;
DROP TABLE mission_question_options;
DROP TABLE mission_questions;
DROP TABLE missions;
DROP TABLE shop_items;
DROP TABLE trails;
DROP TABLE users;
