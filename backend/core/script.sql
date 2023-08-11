CREATE SCHEMA IF NOT EXISTS profile;
CREATE TABLE IF NOT EXISTS profile.information (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile.authentication (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES profile.information(id) ON DELETE CASCADE,
    password_hash VARCHAR(512) NOT NULL,
    salt VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS profile.picture (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES profile.information(id) ON DELETE CASCADE,
    picture BYTEA NOT NULL,
    thumbnail BYTEA NOT NULL
);
CREATE OR REPLACE VIEW profile.full AS
SELECT
    i.id AS information_id,
    i.username,
    i.created_at,
    a.id AS authentication_id,
    a.password_hash,
    a.salt
FROM
    profile.information i
LEFT JOIN
    profile.authentication a ON i.id = a.user_id;
