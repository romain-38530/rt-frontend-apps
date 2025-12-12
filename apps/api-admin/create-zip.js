const fs = require('fs');
const path = require('path');

// Use globally installed archiver
const archiver = require('C:/Users/rtard/AppData/Roaming/npm/node_modules/archiver');

const deployDir = path.join(__dirname, 'deploy');
const outputPath = path.join(__dirname, 'deploy-v1.8.0.zip');

// Remove existing zip
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`ZIP created: ${archive.pointer()} bytes`);
  console.log(`Output: ${outputPath}`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add files with forward slashes (archiver handles this correctly)
archive.directory(deployDir, false);

archive.finalize();
