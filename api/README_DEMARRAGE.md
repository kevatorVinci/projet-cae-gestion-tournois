# Guide de démarrage du projet CAE

## ✅ Problèmes résolus

Tous les problèmes de compilation ont été corrigés :

- ✅ Les dépendances Spring Security et JWT ont été ajoutées au `pom.xml`
- ✅ Les tests passent tous (10/10) ✅
- ✅ La compilation fonctionne sans erreurs

## 🐳 Démarrage de PostgreSQL avec Docker

### Prérequis

Docker Desktop doit être installé et démarré sur votre machine.

### Étape 1 : Démarrer Docker Desktop

1. Lancez l'application **Docker Desktop**
2. Attendez que l'icône Docker dans la barre des tâches soit verte
3. Vérifiez que Docker fonctionne avec la commande :
   ```powershell
   docker --version
   ```

### Étape 2 : Démarrer PostgreSQL

Dans le terminal PowerShell, exécutez :

```powershell
cd C:\Ecole\CAE\Project\cae-group-35\api
docker-compose up -d
```

### Étape 3 : Vérifier que PostgreSQL fonctionne

```powershell
docker ps
```

Vous devriez voir un conteneur nommé `postgres_container` en cours d'exécution.

## 🚀 Lancer l'application Spring Boot

### Option 1 : Avec Maven

```powershell
cd C:\Ecole\CAE\Project\cae-group-35\api
.\mvnw spring-boot:run
```

### Option 2 : Dans votre IDE

- Exécutez la classe `DemoApplication.java`

L'application sera accessible sur : http://localhost:3000

## 🧪 Exécuter les tests

```powershell
cd C:\Ecole\CAE\Project\cae-group-35\api
.\mvnw clean test
```

Résultat actuel : **10 tests passent avec succès** ✅

## 📊 Structure de la base de données

La base de données est créée automatiquement par Hibernate avec les tables suivantes :

- **users** : Table pour l'authentification (email, password, etc.)
- **equipes** : Table des équipes
- **membres** : Table des membres d'équipes

Les données de test sont insérées depuis `src/main/resources/insert.sql`

## 🔧 Configuration de la base de données

Configuration actuelle dans `application.properties` :

```properties
spring.datasource.url=jdbc:postgresql://localhost:55432/cae_db
spring.datasource.username=postgres
spring.datasource.password=postgres
```

## 🐛 Résolution des problèmes courants

### Problème : "Failed to obtain JDBC Connection"

**Cause** : PostgreSQL n'est pas démarré
**Solution** : Lancez Docker Desktop puis `docker-compose up -d`

### Problème : "Port 5432 already in use"

**Cause** : Un autre PostgreSQL est déjà en cours d'exécution
**Solution** :

```powershell
# Arrêter tous les conteneurs PostgreSQL
docker-compose down

# Ou arrêter le service PostgreSQL local
# Services > PostgreSQL > Arrêter
```

Note: ce projet utilise maintenant le port hote `55432` pour eviter les conflits avec un PostgreSQL local.

### Problème : Erreurs de compilation

**Solution** : Les dépendances sont maintenant correctement configurées dans le `pom.xml`

## 📝 Points importants

1. **Lombok** : Le projet utilise Lombok pour générer automatiquement les getters/setters. Assurez-vous que le plugin Lombok est installé dans votre IDE.

2. **Records Java** : Les DTOs utilisent les records Java (feature de Java 16+), qui sont immutables par défaut.

3. **Spring Security** : L'authentification est configurée avec JWT (JSON Web Tokens).

## 🎯 Endpoints disponibles

### Authentification

- `POST /auths/login` : Connexion
- `POST /auths/register` : Inscription

### Équipes

- `GET /equipes` : Liste des équipes
- `POST /equipes` : Créer une équipe
- `POST /equipes/{id}/join` : Rejoindre une équipe

### Membres

- `GET /membres` : Liste des membres
- `GET /membres/{id}` : Détails d'un membre
- `POST /membres` : Ajouter un membre

---

**Status** : ✅ Prêt pour le développement
**Dernière mise à jour** : 09/03/2026
