-- Seed the shortener database. Runs automatically the first time the pg container
-- initializes (as user "app" against database "shortener").

-- Global counter for key generation (the counter+base62 fork from the video).
-- Starts at 10000 so student-created codes never collide with the seeded ones.
CREATE SEQUENCE link_ids START 10000;

CREATE TABLE links (
    id       bigint PRIMARY KEY,
    code     text   NOT NULL UNIQUE,
    long_url text   NOT NULL
);

-- Seeded links. cat42 is the "celebrity link" the hot-key tasks hammer.
INSERT INTO links (id, code, long_url) VALUES
  (1, 'new1', 'https://sanattudu.tech'),
  (2, 'new2', 'https://n8n.sanattudu.tech'),
  (3, 'new3', 'https://jenkins.sanattudu.tech');
