CREATE TABLE users (
    user_id     UUID        PRIMARY KEY,
    email       TEXT        UNIQUE NOT NULL,
    password_hash TEXT      NOT NULL,
    role        TEXT        NOT NULL CHECK (role IN ('STUDENT','STAFF','LIBRARIAN','EXTERNAL')),
    status      TEXT        NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
    profile_id  UUID PRIMARY KEY,
    user_id     UUID UNIQUE NOT NULL REFERENCES users(user_id),
    full_name   TEXT NOT NULL,
    member_type TEXT NOT NULL CHECK (member_type IN ('STUDENT','STAFF','EXTERNAL')),
    matric_no   TEXT UNIQUE,
    staff_id    TEXT UNIQUE,
    card_number TEXT UNIQUE NOT NULL,
    phone       TEXT
);
