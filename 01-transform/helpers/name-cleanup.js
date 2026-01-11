const fs = require("fs");
const path = require("path");
const { cleanSpecialElements } = require("./clean-special-elements");

// Load cleanup patterns from JSON files
let cleanupPatterns = [];
try {
  // Load general cleanup patterns
  const patternsPath = path.join(__dirname, '..', 'constants', 'tamil-cleanup.json');
  const patternsData = fs.readFileSync(patternsPath, 'utf8');
  const generalPatterns = JSON.parse(patternsData);

  // Load actor name cleanup patterns
  const actorPatternsPath = path.join(__dirname, '..', 'constants', 'actor-name-cleanup.json');
  const actorPatternsData = fs.readFileSync(actorPatternsPath, 'utf8');
  const actorPatterns = JSON.parse(actorPatternsData);

  // Combine both pattern arrays
  cleanupPatterns = [...generalPatterns, ...actorPatterns];
} catch (error) {
  console.error('Error loading cleanup patterns:', error);
  // Fallback to empty array if file can't be loaded
  cleanupPatterns = [];
}

// Function to keep only English letters, numbers, and spaces
function keepEnglishAndNumbers(text) {
  return text.replace(/[^A-Za-z0-9 ]+/g, '').trim();
}

// Function to remove years from text
function removeYear(text) {
  return text.replace(/\b(19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim();
}

// Function to clean up movie names by removing common phrases
function cleanMovieName(name) {
  if (!name) return name;

  let cleanedName = name;

  // Step 1: Remove years first
  cleanedName = removeYear(cleanedName);

  // Step 2: Keep only English letters, numbers, and spaces
  cleanedName = keepEnglishAndNumbers(cleanedName);

  // Step 3: Remove the Keywords present in name
  cleanupPatterns.forEach(pattern => {
    try {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundaries \b to match exact words only
      const regex = new RegExp(`\\b${escapedPattern}\\b`, 'gi');
      cleanedName = cleanedName.replace(regex, ' ');
    } catch (error) {
      console.error(`Error applying pattern "${pattern}":`, error);
    }
  });

  // Step 4: Remove Special Characters, emojis, trailing separators and punctuation
  cleanedName = cleanSpecialElements(cleanedName);

  // Step 5: Remove (extra cleanup)
  // Split by common separators and take the first meaningful part
  const parts = cleanedName.split(/\s+/);
  let mainTitle = parts.filter(part => part.length > 0).join(' ');

  return mainTitle;
}

module.exports = {
  cleanMovieName
};
