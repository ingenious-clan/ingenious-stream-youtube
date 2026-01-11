const fs = require('fs');
const path = require('path');

// Paths
const inputPath = path.join(__dirname, '../output/tamil-meta.json');
const outputDir = path.join(__dirname, '../../movies/language/tamil');

// Configuration
const MOVIES_PER_FILE = 200;

// Read the input data
const movies = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log(`Total movies to group: ${movies.length}`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Split movies into chunks of 200
const chunks = [];
for (let i = 0; i < movies.length; i += MOVIES_PER_FILE) {
  chunks.push(movies.slice(i, i + MOVIES_PER_FILE));
}

console.log(`Creating ${chunks.length} file(s)...`);

// Write each chunk to a separate file
chunks.forEach((chunk, index) => {
  const fileName = String(index).padStart(2, '0') + '.json';
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(chunk, null, 2), 'utf8');

  console.log(`✓ Created ${fileName} with ${chunk.length} movies`);
});

// Create _meta.json with statistics
const metaData = {
  total: movies.length,
  files: chunks.length,
  moviesPerFile: MOVIES_PER_FILE,
  lastUpdated: new Date().toISOString()
};

const metaFilePath = path.join(outputDir, '_meta.json');
fs.writeFileSync(metaFilePath, JSON.stringify(metaData, null, 2), 'utf8');

console.log(`\n✓ Successfully grouped ${movies.length} movies into ${chunks.length} file(s)`);
console.log(`✓ Created _meta.json with statistics`);
console.log(`✓ Output directory: ${outputDir}`);
