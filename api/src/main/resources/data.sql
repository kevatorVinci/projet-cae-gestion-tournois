-- ============================================================
-- data.sql — Seed complet pour tester la BD
-- À placer dans : src/main/resources/data.sql
-- Spring l'exécute automatiquement au démarrage
-- ============================================================
-- Mot de passe pour tous les membres : "password"
-- (hash BCrypt généré avec BCryptPasswordEncoder)
-- ============================================================

-- ========================
-- 1. ÉQUIPES (sans responsables pour l'instant)
-- ========================

INSERT INTO equipes (name, primary_responsible_id, secondary_responsible_id)
VALUES ('Les Invincibles', NULL, NULL);

INSERT INTO equipes (name, primary_responsible_id, secondary_responsible_id)
VALUES ('Shadow Squad', NULL, NULL);

INSERT INTO equipes (name, primary_responsible_id, secondary_responsible_id)
VALUES ('Dragon Force', NULL, NULL);

-- ========================
-- 2. MEMBRES
-- ========================

-- Les Invincibles (equipe_id = 1)
INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('alice@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'AliceTag', 'architecte', true, NOW(), 1, 1);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('bob@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'BobTag', 'gardien', false, NOW(), 2, 1);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('charlie@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'CharlieTag', 'tacticien', false, NOW(), 3, 1);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('diana@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'DianaTag', 'guerisseuse', false, NOW(), 4, 1);

-- Shadow Squad (equipe_id = 2)
INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('eve@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'EveTag', 'executeur', false, NOW(), 1, 2);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('frank@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'FrankTag', 'catalyseur', false, NOW(), 2, 2);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('grace@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'GraceTag', 'perturbateur', false, NOW(), 3, 2);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('hugo@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'HugoTag', 'gardien', false, NOW(), 4, 2);

-- Dragon Force (equipe_id = 3)
INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('ivan@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'IvanTag', 'architecte', false, NOW(), 1, 3);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('julia@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'JuliaTag', 'tacticien', false, NOW(), 2, 3);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('kevin@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'KevinTag', 'executeur', false, NOW(), 3, 3);

INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('lea@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'LeaTag', 'guerisseuse', false, NOW(), 4, 3);

-- Membre sans équipe
INSERT INTO membres (mail, mot_de_passe, tag_jeu, specialite, est_administrateur, date_creation_profil, image_id, equipe_id)
VALUES ('solo@vinci.be', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnGVhLpT97W', 'SoloTag', 'catalyseur', false, NOW(), 1, NULL);

-- ========================
-- 3. MISE À JOUR DES RESPONSABLES
-- (maintenant que les membres ont un id)
-- alice (id=1) → responsable de "Les Invincibles"
-- eve   (id=5) → responsable de "Shadow Squad"
-- ivan  (id=9) → responsable de "Dragon Force"
-- ========================

UPDATE equipes SET primary_responsible_id = 1 WHERE id = 1;
UPDATE equipes SET primary_responsible_id = 5 WHERE id = 2;
UPDATE equipes SET primary_responsible_id = 9 WHERE id = 3;