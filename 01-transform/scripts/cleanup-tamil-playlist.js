const fs = require('fs');
const path = require('path');
const { cleanMovieName } = require('../helpers/name-cleanup');

// Directory paths
const inputDir = path.join(__dirname, '../../00-extract/output/tamil/playlist');
const outputDir = path.join(__dirname, '../output/tamil/playlist');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all JSON files in the input directory
const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.json'));

console.log(`Found ${files.length} playlist files to process`);

// Process each playlist file
files.forEach(file => {
  const filePath = path.join(inputDir, file);
  const playlistName = path.basename(file, '.json'); // Use filename as playlist name

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Handle both array format and object format
    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.result && Array.isArray(data.result)) {
      items = data.result;
    } else {
      console.warn(`File ${file} has unexpected format, skipping...`);
      return;
    }

    // Clean up names for each item
    const cleanedItems = items.map(item => ({
      ...item,
      originalName: item.name,
      name: cleanMovieName(item.name)
    }));

    // Create output object organized by playlist
    const outputData = {
      playlistName,
      totalItems: cleanedItems.length,
      items: cleanedItems,
      processedAt: new Date().toISOString()
    };

    // Write to output file
    const outputFile = path.join(outputDir, `${playlistName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

    console.log(`✓ Processed playlist: ${playlistName} (${cleanedItems.length} items)`);

  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
});

console.log(`\nPlaylist cleanup complete! Processed ${files.length} playlists.`);
