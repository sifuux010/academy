-- =====================================================================
-- KINEDOK ACADÉMIE — création de la base et du compte applicatif
-- MySQL 8.0 (ou MariaDB 10.5+)
--
--   mysql -u root -p < db/create_database.sql
--
-- Ce fichier ne crée AUCUNE table : le schéma appartient aux migrations
-- Django, qui en sont la seule source de vérité.
--
--   cd backend
--   python manage.py migrate
--   python manage.py seed_taxonomies && python manage.py seed_content
--   python manage.py seed_promotions
--   python manage.py createsuperuser
--
-- Écrire les tables à la main ici les ferait diverger des modèles au
-- premier `makemigrations`, et Django ne saurait plus où il en est.
-- =====================================================================

-- ------------------------------------------------------------- Base --
--
-- utf8mb4 : l'arabe et les emoji ne tiennent pas dans l'ancien « utf8 »
-- de MySQL, qui s'arrête à trois octets. utf8mb4_unicode_ci compare les
-- caractères accentués comme on les attend en français.
CREATE DATABASE IF NOT EXISTS `qsyagngb_academy`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------- Compte --
--
-- Un compte dédié à l'application, limité à cette base : si les
-- identifiants fuitent, le reste du serveur n'est pas exposé.
--
-- REMPLACEZ le mot de passe avant exécution, puis reportez-le dans
-- `backend/.env` (DB_PASSWORD).
-- La version prête à exécuter, avec le mot de passe réel, est dans
-- `db/create_database.local.sql` (hors versionnement).
CREATE USER IF NOT EXISTS 'qsyagngb_amdjed'@'localhost'
  IDENTIFIED BY 'CHANGEZ_MOI';

-- Droits de données et de schéma : Django crée, modifie et supprime des
-- tables à chaque migration. ALTER, INDEX, CREATE et DROP sont donc
-- nécessaires — mais seulement sur cette base.
--
-- REFERENCES est requis pour les clés étrangères, et le lot complet
-- permet aussi `manage.py test`, qui crée une base `test_…` ; si les
-- tests tournent sur ce compte, ajouter le même GRANT sur `test_qsyagngb_academy`.
GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, DROP, ALTER, INDEX, REFERENCES
  ON `qsyagngb_academy`.*
  TO 'qsyagngb_amdjed'@'localhost';

-- Base de test, créée et détruite par `manage.py test`.
GRANT ALL PRIVILEGES ON `test_qsyagngb_academy`.* TO 'qsyagngb_amdjed'@'localhost';

FLUSH PRIVILEGES;

-- ------------------------------------------------------ Vérification --
SELECT
  SCHEMA_NAME                 AS base,
  DEFAULT_CHARACTER_SET_NAME  AS jeu_de_caracteres,
  DEFAULT_COLLATION_NAME      AS collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'qsyagngb_academy';
