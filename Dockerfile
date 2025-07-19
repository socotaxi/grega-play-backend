# Étape de base avec Node.js et FFmpeg
FROM node:18

# Installer FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Créer le dossier app
WORKDIR /app

# Copier les fichiers de l'application
COPY . .

# Installer les dépendances
RUN npm ci

# Lancer l'application
CMD ["node", "index.js"]
