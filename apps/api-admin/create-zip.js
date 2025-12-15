const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, 'deploy-v2.1.4-sial-lead.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('ZIP created: ' + archive.pointer() + ' bytes');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(path.join(__dirname, 'deploy'), false);
archive.finalize();
