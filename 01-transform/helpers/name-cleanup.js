const fs = require("fs");
const path = require("path");

// Function to clean up movie names by removing common phrases
function cleanMovieName(name) {
  if (!name) return name;

  // Remove common phrases that are not part of the actual movie title
  let cleanedName = name
    // Remove "Full Movie HD"
    .replace(/\s*Full\s+Movie\s+HD\s*/gi, " ")
    // Remove "Exclusive Tamil Full Movie"
    .replace(/\s*Exclusive\s+Tamil\s+Full\s+Movie\s*/gi, " ")
    // Remove "Tamil Full Movie"
    .replace(/\s*Tamil\s+Full\s+Movie\s*/gi, " ")
    // Remove "Latest Tamil Full Movie"
    .replace(/\s*Latest\s+Tamil\s+Full\s+Movie\s*/gi, " ")
    // Remove "Tamil Movie HD"
    .replace(/\s*Tamil\s+Movie\s+HD\s*/gi, " ")
    // Remove "Full Movie"
    .replace(/\s*Full\s+Movie\s*/gi, " ")
    // Remove "Tamil Movie"
    .replace(/\s*Tamil\s+Movie\s*/gi, " ")
    // Remove "Latest Tamil Movie"
    .replace(/\s*Latest\s+Tamil\s+Movie\s*/gi, " ")
    // Remove "Super Hit Tamil Movie HD"
    .replace(/\s*Super\s+Hit\s+Tamil\s+Movie\s+HD\s*/gi, " ")
    // Remove "Super Hit Tamil Movie"
    .replace(/\s*Super\s+Hit\s+Tamil\s+Movie\s*/gi, " ")
    // Remove "Latest Full Movies"
    .replace(/\s*Latest\s+Full\s+Movies\s*/gi, " ")
    // Remove "Full Length Tamil Movie Online"
    .replace(/\s*Full\s+Length\s+Tamil\s+Movie\s+Online\s*/gi, " ")
    // Remove "Tamil Cinema"
    .replace(/\s*Tamil\s+Cinema\s*/gi, " ")
    // Remove "Tamil Cinema Junction"
    .replace(/\s*Tamil\s+Cinema\s+Junction\s*/gi, " ")
    // Remove "Bicstol Movie"
    .replace(/\s*Bicstol\s+Movie\s*/gi, " ")
    // Remove "Star Movies"
    .replace(/\s*Star\s+Movies\s*/gi, " ")
    // Remove "MSK Movies"
    .replace(/\s*MSK\s+Movies\s*/gi, " ")
    // Remove "Thamizh Padam"
    .replace(/\s*Thamizh\s+Padam\s*/gi, " ")
    // Remove "DMY"
    .replace(/\s*DMY\s*/gi, " ")
    // Additional patterns to remove
    // Remove "Tamil Dubbed"
    .replace(/\s*Tamil\s+Dubbed\s*/gi, " ")
    // Remove "Full Action Movie HD"
    .replace(/\s*Full\s+Action\s+Movie\s+HD\s*/gi, " ")
    // Remove "Movie HD"
    .replace(/\s*Movie\s+HD\s*/gi, " ")
    // Remove "Latest Tamil"
    .replace(/\s*Latest\s+Tamil\s*/gi, " ")
    // Remove "Full"
    .replace(/\s*Full\s*/gi, " ")
    // Remove "superhit"
    .replace(/\s*superhit\s*/gi, " ")
    // Remove "(Tamil)"
    .replace(/\s*\([Tt]amil\)\s*/g, " ")
    // Remove "Full HD Tamil New Movie"
    .replace(/\s*Full\s+HD\s+Tamil\s+New\s+Movie\s*/gi, " ")
    // Additional patterns from the new list
    // Remove "NEW RELEASE"
    .replace(/\s*NEW\s+RELEASE\s*/gi, " ")
    // Remove year patterns like (2010), (1994)
    .replace(/\s*\([0-9]{4}\)\s*/g, " ")
    // Remove "Tamil Super Hit Action Movie"
    .replace(/\s*Tamil\s+Super\s+Hit\s+Action\s+Movie\s*/gi, " ")
    // Remove "Tamil Thriller Movie -New - English subtitles -HD"
    .replace(/\s*Tamil\s+Thriller\s+Movie\s+-New\s+-\s+English\s+subtitles\s+-HD\s*/gi, " ")
    // Remove "Horror HD Movie"
    .replace(/\s*Horror\s+HD\s+Movie\s*/gi, " ")
    // Remove "Quality"
    .replace(/\s*Quality\s*/gi, " ")
    // Remove "Best Family Entertainer"
    .replace(/\s*Best\s+Family\s+Entertainer\s*/gi, " ")
    // Remove "New 2018"
    .replace(/\s*New\s+[0-9]{4}\s*/gi, " ")
    // Remove "HD Tamil New Movie"
    .replace(/\s*HD\s+Tamil\s+New\s+Movie\s*/gi, " ")
    // Remove "Tamil Latest 2018"
    .replace(/\s*Tamil\s+Latest\s+[0-9]{4}\s*/gi, " ")
    // Remove "Watch Free Length Online"
    .replace(/\s*Watch\s+Free\s+Length\s+Online\s*/gi, " ")
    // Additional patterns from the additional list
    // Remove "DVD"
    .replace(/\s*DVD\s*/gi, " ")
    // Remove year patterns like (1982)
    .replace(/\s*\([0-9]{4}\)\s*/g, " ")
    // Remove "Exclusive"
    .replace(/\s*Exclusive\s*/gi, " ")
    // Remove "Private video"
    .replace(/\s*Private\s+video\s*/gi, " ")
    // Remove "Latest"
    .replace(/\s*Latest\s*/gi, " ")
    // Remove "Deleted video"
    .replace(/\s*Deleted\s+video\s*/gi, " ")
    // Additional patterns for action and genre descriptions
    // Remove "Action Blockbuster Movie"
    .replace(/\s*Action\s+Blockbuster\s+Movie\s*/gi, " ")
    // Remove "Tamil Crime Thriller HD Movie"
    .replace(/\s*Tamil\s+Crime\s+Thriller\s+HD\s+Movie\s*/gi, " ")
    // Remove " - Official"
    .replace(/\s*-\s*Official\s*/gi, " ")
    // Additional patterns from the latest list
    // Remove "Action Movie"
    .replace(/\s*Action\s+Movie\s*/gi, " ")
    // Remove "Goldencinema"
    .replace(/\s*Goldencinema\s*/gi, " ")
    // Remove "HD"
    .replace(/\s*HD\s*/gi, " ")
    // Remove "Movie Climax"
    .replace(/\s*Movie\s+Climax\s*/gi, " ")
    // Remove "Tamil Horror"
    .replace(/\s*Tamil\s+Horror\s*/gi, " ")
    // Remove "Telugu"
    .replace(/\s*Telugu\s*/gi, " ")
    // Remove "Movie"
    .replace(/\s*Movie\s*/gi, " ")
    // Remove "2018 HD Movie"
    .replace(/\s*[0-9]{4}\s+HD\s+Movie\s*/gi, " ")
    // Remove multiple spaces with a single space
    .replace(/\s+/g, " ")
    // Trim leading and trailing spaces
    .trim();

  // Clean up separators within the name - extract the main movie title
  // Split by common separators and take the first meaningful part
  const parts = cleanedName.split(/[\|,;:]/);
  let mainTitle = parts[0].trim();

  // Remove trailing separators and punctuation
  mainTitle = mainTitle
    .replace(/\s*[|]\s*$/, '') // Remove trailing |
    .replace(/\s*[|]\s*[|]\s*$/, '') // Remove trailing ||
    .replace(/\s*[|]\s*$/, '') // Remove trailing |
    .replace(/\s*-\s*$/, '') // Remove trailing -
    .replace(/\s*-\s*-\s*$/, '') // Remove trailing --
    .replace(/\s*[.,;:]+\s*$/, '') // Remove trailing punctuation
    // Remove multiple spaces again after punctuation removal
    .replace(/\s+/g, " ")
    // Final trim
    .trim();

  return mainTitle;
}

// Function to create a slug from a name
function createSlug(name) {
  if (!name) return name;
  
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
}

module.exports = {
  cleanMovieName,
  createSlug
};
