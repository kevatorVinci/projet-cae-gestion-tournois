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

INSERT INTO equipes(name, profile_image)
VALUES ('Dark Legion', '/images/team-dark-legion.png'),
       ('Code Titans', '/images/team-code-titans.png'),
       ('Nebula Wolves', '/images/team-nebula-wolves.png'),
       ('Iron Lynx', '/images/team-iron-lynx.png'),
       ('Pixel Nomads', '/images/team-pixel-nomads.png'),
       ('Crimson Orbit', '/images/team-crimson-orbit.png'),
       ('Volt Guardians', '/images/team-volt-guardians.png'),
       ('Arctic Phoenix', '/images/team-arctic-phoenix.png');

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

-- Tournoi cloture avec 5 equipes inscrites sur 8 places
INSERT INTO tournois(nom, description, date_debut, date_fin, date_limite_inscription, etat,
                     nombres_participants_max, planning_match_publie)
VALUES ('Vinci Clash Spring 2026',
        'Tournoi cloture de demonstration avec slots partiellement remplis.',
        CURRENT_DATE + 14,
        CURRENT_DATE + 16,
        CURRENT_DATE + 7,
        'CLOTURE',
        8,
        false);

INSERT INTO inscription_equipe_tournoi(id_tournoi, id_equipe, date_inscription)
VALUES
  ((SELECT id FROM tournois WHERE nom = 'Vinci Clash Spring 2026'),
        (SELECT id FROM equipes WHERE name = 'Dark Legion'), CURRENT_DATE - 5),
  ((SELECT id FROM tournois WHERE nom = 'Vinci Clash Spring 2026'),
        (SELECT id FROM equipes WHERE name = 'Code Titans'), CURRENT_DATE - 4),
  ((SELECT id FROM tournois WHERE nom = 'Vinci Clash Spring 2026'),
        (SELECT id FROM equipes WHERE name = 'Nebula Wolves'), CURRENT_DATE - 3),
  ((SELECT id FROM tournois WHERE nom = 'Vinci Clash Spring 2026'),
        (SELECT id FROM equipes WHERE name = 'Iron Lynx'), CURRENT_DATE - 2),
  ((SELECT id FROM tournois WHERE nom = 'Vinci Clash Spring 2026'),
        (SELECT id FROM equipes WHERE name = 'Pixel Nomads'), CURRENT_DATE - 1);
