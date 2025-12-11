/**
 * Script pour créer un ZIP de déploiement compatible Unix pour AWS Elastic Beanstalk
 * Utilise archiver pour garantir des paths avec forward slashes
 */
const archiver = require('C:/Users/rtard/AppData/Roaming/npm/node_modules/archiver');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'v2.15.0-palette-integration.zip';
const SOURCE_DIR = path.join(__dirname, 'deploy-working');

// Supprime l'ancien fichier s'il existe
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}

const output = fs.createWriteStream(path.join(__dirname, OUTPUT_FILE));
const archive = archiver('zip', {
  zlib: { level: 9 } // Compression maximum
});

output.on('close', () => {
  console.log(`✅ Archive créée: ${OUTPUT_FILE}`);
  console.log(`   Taille: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Ajoute le contenu du répertoire deploy-working à la racine du ZIP
// archiver normalise automatiquement les chemins en forward slashes
archive.directory(SOURCE_DIR, false);

archive.finalize();
