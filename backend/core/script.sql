CREATE SCHEMA IF NOT EXISTS user;
CREATE TABLE IF NOT EXISTS user.information {
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
};

CREATE TABLE IF NOT EXISTS user.authentication {
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user.information(id) ON DELETE CASCADE,
    password_hash VARCHAR(512) NOT NULL,
    salt VARCHAR(255) NOT NULL
};

CREATE TABLE IF NOT EXISTS user.profile_picture {
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user.information(id) ON DELETE CASCADE,
    picture BYTEA NOT NULL,
    thumbnail BYTEA NOT NULL
};