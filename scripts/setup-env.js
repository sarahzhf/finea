const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'Connexion_Data.txt');
const destPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(sourcePath)) {
  console.log('Connexion_Data.txt not found. Skipping environment generation.');
  process.exit(0);
}

const data = fs.readFileSync(sourcePath, 'utf8');
const lines = data.split('\n').filter(line => line.trim() !== '');

// Write to .env.local
fs.writeFileSync(destPath, lines.join('\n') + '\n', 'utf8');

console.log('.env.local generated from Connexion_Data.txt');
