const fs = require("fs");
const path = require("path");

// Directory containing playlist data
const playlistDir = path.join(__dirname, "../../output/tamil/playlist");
// Directory to save enriched playlist data with video details
const outputDir = path.join(__dirname, "../../output/tamil/playlist-video-details");

/**
 * Fetch video details from the views4you API
 * @param {string} videoUrl - The YouTube video URL
 * @returns {Promise<Object>} - Video details object
 */
async function fetchVideoDetails(videoUrl) {
  try {
    const apiUrl = "https://views4you.com/api/tools/youtube/video-region";

    console.log({videoUrl})

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "accept": "application/json",
        "origin": "https://views4you.com",
        "referer": "https://views4you.com/tools/youtube-restrictions-checker/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DIi_OzvtqHa4"
      },
      body: JSON.stringify({
        channel_url: videoUrl
      })
    });

    console.log({response})



    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log({data})

    if (data.success && data.data) {
      // Remove available_location from the details
      const { available_location, ...detailsWithoutLocation } = data.data;
      return detailsWithoutLocation;
    } else {
      throw new Error("API returned unsuccessful response");
    }
  } catch (error) {
    console.error(`Error fetching details for ${videoUrl}:`, error.message);
    return null;
  }
}

/**
 * Process a single playlist file
 * @param {string} playlistFilePath - Path to the playlist JSON file
 * @param {string} playlistId - The playlist ID
 */
async function processPlaylist(playlistFilePath, playlistId) {
  try {
    console.log(`\nProcessing playlist: ${playlistId}`);

    // Read the playlist file
    const playlistData = JSON.parse(fs.readFileSync(playlistFilePath, "utf8"));
    const videos = playlistData.result || [];

    console.log(`Found ${videos.length} videos in playlist ${playlistId}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `${playlistId}.json`);

    // Load existing progress if available
    let enrichedVideos = [];
    if (fs.existsSync(outputFilePath)) {
      const existingData = JSON.parse(fs.readFileSync(outputFilePath, "utf8"));
      enrichedVideos = existingData.result || [];
      console.log(`Resuming from existing file with ${enrichedVideos.length} videos`);
    } else {
      // Initialize with all videos without details (only id and details fields)
      enrichedVideos = videos.map(video => ({ id: video.id, details: null }));
    }

    const BATCH_SIZE = 1;
    let processedCount = 0;

    // Process videos in batches
    for (let i = 0; i < enrichedVideos.length; i += BATCH_SIZE) {
      const batch = enrichedVideos.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(enrichedVideos.length / BATCH_SIZE);

      console.log(`  Processing batch ${batchNumber}/${totalBatches} (${batch.length} videos)...`);

      // Process each video in the batch
      for (let j = 0; j < batch.length; j++) {
        const videoIndex = i + j;
        const video = enrichedVideos[videoIndex];

        // Skip if already has details - DO NOT hit API
        if (video.details !== null && video.details !== undefined) {
          console.log(`  ⏭️  Skipping ${video.id} (already has details) - No API call`);
          continue;
        }

        // Only fetch if no details exist
        console.log(`  🔄 Fetching details for ${video.id}...`);
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        const details = await fetchVideoDetails(videoUrl);

        // Update the video with details (only id and details fields)
        enrichedVideos[videoIndex] = {
          id: video.id,
          details: details
        };

        // Save progress immediately after each successful fetch
        const updatedPlaylistData = {
          total: enrichedVideos.length,
          result: enrichedVideos
        };
        fs.writeFileSync(outputFilePath, JSON.stringify(updatedPlaylistData, null, 2));

        processedCount++;
        if (details !== null) {
          console.log(`  ✓ Saved details for ${video.id}`);
        } else {
          console.log(`  ⚠️  Failed to fetch details for ${video.id}`);
        }
      }

      console.log(`  ✓ Batch ${batchNumber}/${totalBatches} completed`);
    }

    const successCount = enrichedVideos.filter(v => v.details !== null).length;
    console.log(`✓ Playlist ${playlistId} completed: ${successCount}/${videos.length} videos enriched`);

    return {
      playlistId,
      total: videos.length,
      success: successCount,
      failed: videos.length - successCount
    };
  } catch (error) {
    console.error(`Error processing playlist ${playlistId}:`, error.message);
    return {
      playlistId,
      total: 0,
      success: 0,
      failed: 0,
      error: error.message
    };
  }
}

/**
 * Main function to process all playlists
 */
async function fetchAllPlaylistVideoDetails() {
  console.log("Starting to fetch video details for all playlists...\n");

  // Read all playlist files
  const playlistFiles = fs.readdirSync(playlistDir)
    .filter(file => file.endsWith(".json"));

  console.log(`Found ${playlistFiles.length} playlist files to process\n`);

  const results = [];

  // Process playlists sequentially to avoid overwhelming the API
  for (const playlistFile of playlistFiles) {
    const playlistId = path.basename(playlistFile, ".json");
    const playlistFilePath = path.join(playlistDir, playlistFile);

    const result = await processPlaylist(playlistFilePath, playlistId);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const totalVideos = results.reduce((sum, r) => sum + r.total, 0);
  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log(`Total playlists processed: ${results.length}`);
  console.log(`Total videos processed: ${totalVideos}`);
  console.log(`Successfully enriched: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log("=".repeat(60));
}

// Run the script
fetchAllPlaylistVideoDetails().catch(console.error);
