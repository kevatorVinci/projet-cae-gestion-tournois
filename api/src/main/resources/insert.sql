-- ============================================================
-- Insertion des données de test pour la base de données CAE
-- ============================================================

-- ============================================================
-- 1. Insertion des utilisateurs (Users)
-- ============================================================

-- Utilisateur 1 : Responsable principal d'équipe
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'alice_smith', 'Leader', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- Utilisateur 2 : Responsable principal d'équipe 2
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'bob_johnson', 'Manager', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- Utilisateur 3 : Membre d'équipe
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('carol@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'carol_davis', 'Developer', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- Utilisateur 4 : Membre d'équipe
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('david@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'david_wilson', 'Designer', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- Utilisateur 5 : Sans équipe (en attente)
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('emma@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'emma_brown', 'Tester', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- Utilisateur 6 : Sans équipe (en attente)
INSERT INTO users (email, password, tag, specialty, profile_image_url, est_administrateur, date_creation_profil)
VALUES ('frank@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX', 'frank_miller', 'Analyst', 'https://example.com/avatar.jpg', false, NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. Insertion des équipes (Equipes)
-- ============================================================

-- Équipe 1 : Dragons
INSERT INTO equipes (name, primary_responsible_id, secondary_responsible_id)
VALUES (
	'Dragons',
	(SELECT id FROM users WHERE email = 'alice@example.com'),
	NULL
)
ON CONFLICT (name) DO NOTHING;

-- Équipe 2 : Phoenix
INSERT INTO equipes (name, primary_responsible_id, secondary_responsible_id)
VALUES (
	'Phoenix',
	(SELECT id FROM users WHERE email = 'bob@example.com'),
	NULL
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. Mise à jour des utilisateurs pour les assigner aux équipes
-- ============================================================

UPDATE users
SET equipe_id = (SELECT id FROM equipes WHERE name = 'Dragons')
WHERE email IN ('alice@example.com', 'carol@example.com', 'david@example.com');

UPDATE users
SET equipe_id = (SELECT id FROM equipes WHERE name = 'Phoenix')
WHERE email IN ('bob@example.com');

-- ============================================================
-- 4. Insertion des demandes de rejoindre une équipe
-- ============================================================

-- Demande 1 : Emma demande à rejoindre les Dragons
INSERT INTO demandes (membre_id, equipe_id, etat, date_demande, date_traitement, raison_refus)
SELECT
	(SELECT id FROM users WHERE email = 'emma@example.com'),
	(SELECT id FROM equipes WHERE name = 'Dragons'),
	'EN_ATTENTE', NOW(), NULL, NULL
WHERE NOT EXISTS (
	SELECT 1
	FROM demandes d
	WHERE d.membre_id = (SELECT id FROM users WHERE email = 'emma@example.com')
		AND d.equipe_id = (SELECT id FROM equipes WHERE name = 'Dragons')
		AND d.etat = 'EN_ATTENTE'
);

-- Demande 2 : Frank demande à rejoindre les Phoenix
INSERT INTO demandes (membre_id, equipe_id, etat, date_demande, date_traitement, raison_refus)
SELECT
	(SELECT id FROM users WHERE email = 'frank@example.com'),
	(SELECT id FROM equipes WHERE name = 'Phoenix'),
	'EN_ATTENTE', NOW(), NULL, NULL
WHERE NOT EXISTS (
	SELECT 1
	FROM demandes d
	WHERE d.membre_id = (SELECT id FROM users WHERE email = 'frank@example.com')
		AND d.equipe_id = (SELECT id FROM equipes WHERE name = 'Phoenix')
		AND d.etat = 'EN_ATTENTE'
);

-- ============================================================
-- Notes sur les données de test
-- ============================================================
-- Mot de passe pour tous les utilisateurs : 'password'
-- (Hash bcrypt : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/shaX)
--
-- Équipes :
-- - Dragons : Alice (responsable principal), Carol, David (membres)
-- - Phoenix : Bob (responsable principal)
--
-- Demandes en attente :
-- - Emma veut rejoindre Dragons
-- - Frank veut rejoindre Phoenix

