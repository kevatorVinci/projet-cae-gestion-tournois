-- ============================================
-- TEST CREDENTIALS FOR DEVELOPMENT
-- ============================================
-- Admin Account:
--   Email: admin@vinci.be
--   Password: 123
--   Tag: Admin
--
-- Team Responsible:
--   Email: sarah@vinci.be
--   Password: 123
--   Tag: SarahC
--   Team: Dark Legion
--
-- Team Member:
--   Email: marc@vinci.be
--   Password: 123
--   Tag: MarcO
--   Team: Dark Legion
--
-- User Without Team:
--   Email: alice@vinci.be
--   Password: 123
--   Tag: AliceNova
--   No Team
-- ============================================

INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin)
VALUES ('admin@vinci.be', '$2a$10$4R7g5kQKn7kdCWLa4mOfM.w7U3F3EZVhCqxCPTB8FCVJJNeCQ1lCK', 'Admin',
        'administrateur', '/images/avatar1.png', null, CURRENT_DATE, true);

INSERT INTO equipes(name)
VALUES ('Dark Legion'),
       ('Code Titans');

-- Responsable principal d'equipe
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('sarah@vinci.be', '$2a$10$4R7g5kQKn7kdCWLa4mOfM.w7U3F3EZVhCqxCPTB8FCVJJNeCQ1lCK', 'SarahC',
        'Architecte', '/images/avatar2.png', 'Dark Legion', CURRENT_DATE, false,
        (SELECT id FROM equipes WHERE name = 'Dark Legion'));

-- Membre de l'equipe (non responsable)
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('marc@vinci.be', '$2a$10$4R7g5kQKn7kdCWLa4mOfM.w7U3F3EZVhCqxCPTB8FCVJJNeCQ1lCK', 'MarcO',
        'Gardien', '/images/avatar3.png', 'Dark Legion', CURRENT_DATE, false,
        (SELECT id FROM equipes WHERE name = 'Dark Legion'));

-- Utilisateur sans equipe
INSERT INTO users(email, password, tag, specialty, profile_image_url, team, creation_date, admin, equipe_id)
VALUES ('alice@vinci.be', '$2a$10$4R7g5kQKn7kdCWLa4mOfM.w7U3F3EZVhCqxCPTB8FCVJJNeCQ1lCK', 'AliceNova',
        'Strategie', '/images/avatar4.png', null, CURRENT_DATE, false, null);

-- Lie le responsable principal a l'equipe
UPDATE equipes
SET primary_responsible_id = (SELECT id FROM users WHERE email = 'sarah@vinci.be')
WHERE name = 'Dark Legion';
