const fs = require("fs");
const path = require("path");
const { cleanMovieName, createSlug } = require("../helpers/name-cleanup");
const { getMovieDetailsFromIMDB } = require("../helpers/imdb-enrichment");

// Directory containing the Tamil playlist JSON files
const inputDir = path.join(__dirname, "../../00-extract/output/tamil/playlist");
const outputDir = path.join(__dirname, "../output");
const outputFile = path.join(outputDir, "tamil.json");

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
      const videosWithPlaylistInfo = videos.map(video => {
        // Clean the movie name by removing common phrases
        const cleanedName = cleanMovieName(video.name);

        // Create a slug from the cleaned name to use as the id
        const nameSlug = createSlug(cleanedName);

        // Create a new object with only the required fields
        const processedVideo = {
          id: nameSlug, // Use the slug of the cleaned name as the id
          name: cleanedName, // Use the cleaned name
          language: "tamil",
          videoId: video.id, // Use the original YouTube video ID
          isActive: true,
          raw: { // Include the original raw data
            id: video.id,
            name: video.name,
            // Add any other original fields if they exist in the source
          },
          final: { // Include the final processed data
            id: nameSlug,
            name: cleanedName,
            language: "tamil",
            videoId: video.id,
            isActive: true
          }
        };

        // Only add the url if it exists and we want to keep it
        // Based on requirements, we don't want url, so we skip it
        // Add any other fields that might be needed but exclude unwanted ones

        return processedVideo;
      }).filter(video => {
        // Filter out videos with names like "Private video" or "Deleted video"
        const lowerCaseName = video.name.toLowerCase();
        return !lowerCaseName.includes('private video') &&
               !lowerCaseName.includes('deleted video');
      });

      allVideos = allVideos.concat(videosWithPlaylistInfo);
      totalPlaylists++;
      totalVideos += videos.length;

      console.log(`  - Added ${videos.length} videos from playlist ${file.replace(".json", "")}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }

  // Remove duplicate videos based on the videoId to ensure uniqueness
  const uniqueVideosMap = new Map();
  for (const video of allVideos) {
    const videoId = video.videoId; // Use videoId for uniqueness check

    // If a video with this videoId doesn't already exist, add it
    if (!uniqueVideosMap.has(videoId)) {
      uniqueVideosMap.set(videoId, video);
    }
  }
  allVideos = Array.from(uniqueVideosMap.values());
  
  // Enrich each video with IMDB details
  console.log(`\nStarting enrichment process for ${allVideos.length} videos...`);
  for (let i = 0; i < allVideos.length; i++) {
    const video = allVideos[i];
    console.log(`Enriching video ${i + 1}/${allVideos.length}: ${video.name}`);

    try {
      // Get movie details from IMDB
      const movieDetails = await getMovieDetailsFromIMDB(video.name);

      if (movieDetails) {
        // Add IMDB details to the video object
        video.description = movieDetails.description;
        video.director = movieDetails.director;
        video.year = movieDetails.year;
        video.writer = movieDetails.writer;
        video.stars = movieDetails.stars;
      } else {
        // Set default values if IMDB details are not found
        video.description = `Description for ${video.name}`;
        video.director = "Unknown";
        video.year = null;
        video.writer = "Unknown";
        video.stars = [];
      }
    } catch (error) {
      console.error(`Error enriching video ${video.name}:`, error.message);
      // Set default values if there's an error
      video.description = `Description for ${video.name}`;
      video.director = "Unknown";
      video.year = null;
      video.writer = "Unknown";
      video.stars = [];
    }

    // Add a small delay to avoid overwhelming the IMDB servers
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }

  // Create the summary object
  const summaryData = {
    total: allVideos.length,
    playlistsProcessed: totalPlaylists,
    totalVideos: totalVideos,
    result: allVideos
  };

  // Write the combined data to the output file
  fs.writeFileSync(outputFile, JSON.stringify(summaryData, null, 2));

  console.log(`\nProcessing complete!`);
  console.log(`- Total playlists processed: ${totalPlaylists}`);
  console.log(`- Total videos collected: ${totalVideos}`);
  console.log(`- Unique videos in result: ${allVideos.length}`);
  console.log(`- Output saved to: ${outputFile}`);
}

// Run the script
processAllTamilVideos().catch(console.error);
