INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin)
VALUES ('admin@vinci.be', '$2y$10$EW75BdcbCfKEA3NbE7in4OiYYacfP3OY4Q2JsVzjxd3jNxxgAEZNu', 'Admin',
        'administrateur', '/images/avatar1.png', null, CURRENT_DATE, true);

INSERT INTO equipes(name)
VALUES ('Dark Legion'),
       ('Code Titans');

-- Responsable principal d'equipe
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('sarah@vinci.be', '$2y$10$EW75BdcbCfKEA3NbE7in4OiYYacfP3OY4Q2JsVzjxd3jNxxgAEZNu', 'SarahC',
        'Architecte', '/images/avatar2.png', 'Dark Legion', CURRENT_DATE, false,
        (SELECT id FROM equipes WHERE name = 'Dark Legion'));

-- Membre de l'equipe (non responsable)
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('marc@vinci.be', '$2y$10$EW75BdcbCfKEA3NbE7in4OiYYacfP3OY4Q2JsVzjxd3jNxxgAEZNu', 'MarcO',
        'Gardien', '/images/avatar3.png', 'Dark Legion', CURRENT_DATE, false,
        (SELECT id FROM equipes WHERE name = 'Dark Legion'));

-- Utilisateur sans equipe
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('alice@vinci.be', '$2y$10$EW75BdcbCfKEA3NbE7in4OiYYacfP3OY4Q2JsVzjxd3jNxxgAEZNu', 'AliceNova',
        'Strategie', '/images/avatar4.png', null, CURRENT_DATE, false, null);

-- Lie le responsable principal a l'equipe
UPDATE equipes
SET primary_responsible_id = (SELECT id FROM users WHERE email = 'sarah@vinci.be')
WHERE name = 'Dark Legion';
