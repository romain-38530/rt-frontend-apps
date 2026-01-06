const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'deploy-v2.18.0-node.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('Archive created: ' + archive.pointer() + ' bytes');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add directory contents with Unix paths
archive.directory('deploy-package-v2.18/', false);

archive.finalize();
