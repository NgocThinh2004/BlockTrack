const fs = require('fs');
const path = require('path');

function ensureDirectoriesExist() {
  const directories = [
    path.join(__dirname, '../sessions'),
    path.join(__dirname, '../public/qrcodes')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

module.exports = ensureDirectoriesExist;
