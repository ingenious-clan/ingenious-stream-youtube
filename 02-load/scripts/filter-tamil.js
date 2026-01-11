const fs = require("fs");
const path = require("path");
const { cleanMovieName } = require("../../01-transform/helpers/name-cleanup");
const { createSlug } = require("../../01-transform/helpers/create-slug");

// Directory containing the Tamil playlist JSON files
const inputDir = path.join(__dirname, "../../00-extract/output/tamil/playlist");
const outputDir = path.join(__dirname, "../output/tamil");

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

          // Create a new object with only the required fields
          return {
            id: nameSlug,
            name: cleanedName,
            videoId: video.id,
            isActive: true
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
