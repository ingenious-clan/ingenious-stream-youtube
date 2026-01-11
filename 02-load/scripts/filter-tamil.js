const fs = require("fs");
const path = require("path");
const { cleanMovieName } = require("../../01-transform/helpers/name-cleanup");
const { createSlug } = require("../../01-transform/helpers/create-slug");

// Directory containing the Tamil playlist JSON files
const inputDir = path.join(__dirname, "../../00-extract/output/tamil/playlist");
const videoDetailsDir = path.join(__dirname, "../../00-extract/output/tamil/playlist-video-details");
const outputDir = path.join(__dirname, "../output/tamil");

/**
 * Parse duration string "HH:MM:SS" and return total minutes
 * @param {string} time - Duration in format "HH:MM:SS"
 * @returns {number} - Total minutes
 */
function parseDurationToMinutes(time) {
  if (!time || typeof time !== 'string') return 0;

  const parts = time.split(':').map(p => parseInt(p, 10));
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 60) + minutes + (seconds / 60);
  }
  return 0;
}

/**
 * Determine if video should be active based on details
 * @param {Object} details - Video details object
 * @returns {boolean} - Whether video should be active
 */
function determineIsActive(details) {
  // If no details, default to true
  if (!details) return true;

  // Check embeddable status
  if (details.embeddable === false) return false;
  if (details.embeddable === true || details.embeddable === "Unknown") {
    // Check duration - must be at least 90 minutes
    if (details.time) {
      const durationMinutes = parseDurationToMinutes(details.time);
      if (durationMinutes < 90) return false;
    }
    return true;
  }

  // Default to true if embeddable field is missing
  return true;
}

// Function to read and process all Tamil playlist files
async function processAllTamilVideos() {
  console.log("Starting to process all Tamil playlist files...");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all JSON files in the input directory
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith(".json"));

  console.log(`Found ${files.length} Tamil playlist files to process`);

  // Load all video details into a map
  const videoDetailsMap = new Map();
  if (fs.existsSync(videoDetailsDir)) {
    const detailFiles = fs.readdirSync(videoDetailsDir).filter(file => file.endsWith(".json"));
    console.log(`Loading video details from ${detailFiles.length} files...`);

    for (const detailFile of detailFiles) {
      try {
        const detailFilePath = path.join(videoDetailsDir, detailFile);
        const detailData = JSON.parse(fs.readFileSync(detailFilePath, "utf8"));

        if (detailData.result && Array.isArray(detailData.result)) {
          for (const item of detailData.result) {
            if (item.id && item.details) {
              videoDetailsMap.set(item.id, item.details);
            }
          }
        }
      } catch (error) {
        console.warn(`Error loading video details from ${detailFile}:`, error.message);
      }
    }
    console.log(`Loaded details for ${videoDetailsMap.size} videos`);
  } else {
    console.warn(`Video details directory not found: ${videoDetailsDir}`);
  }

  let allVideos = [];
  let totalPlaylists = 0;
  let totalVideos = 0;

  // Process each JSON file
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    console.log(`Processing file: ${file}`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Handle both the old format (array) and new format (with total/result)
      let videos;
      if (Array.isArray(data)) {
        videos = data;
      } else if (data && data.result && Array.isArray(data.result)) {
        videos = data.result;
      } else {
        console.warn(`File ${file} has unexpected format, skipping...`);
        continue;
      }

      // Process each video to include only required fields
      const videosWithPlaylistInfo = videos
        .map(video => {
          // Clean the movie name by removing common phrases
          const cleanedName = cleanMovieName(video.name);

          // Create a slug from the cleaned name to use as the id
          const nameSlug = createSlug(cleanedName);

          // Get video details if available
          const details = videoDetailsMap.get(video.id);

          // Determine isActive status based on details
          const isActive = determineIsActive(details);

          // Create a new object with only the required fields
          return {
            id: nameSlug,
            name: cleanedName,
            videoId: video.id,
            isActive: isActive
          };
        })
        .filter(video => {
          // Filter out videos with empty id or name
          if (!video.id || !video.name || video.id.trim() === "" || video.name.trim() === "") {
            return false;
          }

          // Filter out videos with names like "Private video" or "Deleted video"
          const lowerCaseName = video.name.toLowerCase();
          return !lowerCaseName.includes('private video') &&
                 !lowerCaseName.includes('deleted video');
        });

      allVideos = allVideos.concat(videosWithPlaylistInfo);
      totalPlaylists++;
      totalVideos += videosWithPlaylistInfo.length;

      console.log(`  - Added ${videosWithPlaylistInfo.length} videos from playlist ${file.replace(".json", "")}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }

  // Remove duplicate videos based on the videoId to ensure uniqueness
  const uniqueVideosMap = new Map();
  for (const video of allVideos) {
    if (!uniqueVideosMap.has(video.videoId)) {
      uniqueVideosMap.set(video.videoId, video);
    }
  }
  allVideos = Array.from(uniqueVideosMap.values());

  // Remove duplicate IDs (keep first occurrence only)
  const uniqueByIdMap = new Map();
  for (const video of allVideos) {
    if (!uniqueByIdMap.has(video.id)) {
      uniqueByIdMap.set(video.id, video);
    }
  }
  allVideos = Array.from(uniqueByIdMap.values());

  // Write combined tamil-meta.json file
  const combinedOutputFile = path.join(path.dirname(outputDir), "tamil-meta.json");
  fs.writeFileSync(combinedOutputFile, JSON.stringify(allVideos, null, 2));

  console.log(`\nProcessing complete!`);
  console.log(`- Total playlists processed: ${totalPlaylists}`);
  console.log(`- Total videos collected: ${totalVideos}`);
  console.log(`- Unique videos written: ${allVideos.length}`);
  console.log(`- Output file: ${combinedOutputFile}`);
}

// Run the script
processAllTamilVideos().catch(console.error);
