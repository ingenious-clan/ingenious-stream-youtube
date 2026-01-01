/**
 * Helper functions for Sanishtech APIs
 */

const fs = require("fs");
const path = require("path");

/**
 * Fetch videos from a YouTube playlist using the Sanishtech API
 * @param {string} playlistUrl - The YouTube playlist URL
 * @returns {Promise<Array>} - Array of video objects
 */
async function fetchPlaylistVideos(playlistUrl) {
  try {
    // Extract playlist ID from the URL
    const playlistId = new URL(playlistUrl).searchParams.get("list");
    
    // Construct the API endpoint URL
    const apiUrl = `https://sanishtech.com/wp-json/sanish/v1/yt-playlist-links?q=${encodeURIComponent(playlistUrl)}`;
    
    console.log(`Using API endpoint: ${apiUrl}`);

    // Fetch data from the API
    let response;
    try {
      response = await fetch(apiUrl);
    } catch (fetchError) {
      console.error(`Failed to fetch from API for playlist ${playlistUrl}:`, fetchError.message);
      throw fetchError;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`Failed to parse JSON response for playlist ${playlistUrl}:`, jsonError.message);
      throw jsonError;
    }
    
    // Extract video information from the API response
    // The API returns an object with an "items" property containing the video data
    let videos = [];
    if (data && Array.isArray(data.items)) {
      videos = data.items.map(video => ({
        id: video.videoId,
        name: video.title,
        url: video.videoUrl,
        index: video.index,
        position: video.position,
        publishedAt: video.publishedAt
        // API doesn't seem to provide duration in the response
        // Add other fields as needed
      }));
    }

    return videos;
  } catch (error) {
    console.error(`Error processing playlist ${playlistUrl}:`, error.message);
    return [];
  }
}

/**
 * Fetch videos from multiple playlists concurrently
 * @param {Array<string>} playlistUrls - Array of YouTube playlist URLs
 * @returns {Promise<Array>} - Array of results for each playlist
 */
async function fetchMultiplePlaylists(playlistUrls) {
  // Process all playlists concurrently for better performance
  const results = await Promise.allSettled(
    playlistUrls.map(playlistUrl => fetchPlaylistVideos(playlistUrl))
  );

  // Convert results to a more usable format
  const processedResults = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        playlistUrl: playlistUrls[index],
        success: true,
        videos: result.value,
        error: null
      };
    } else {
      return {
        playlistUrl: playlistUrls[index],
        success: false,
        videos: [],
        error: result.reason
      };
    }
  });

  // Count successful and failed operations
  const successful = processedResults.filter(result => result.success).length;
  const failed = processedResults.filter(result => !result.success).length;

  console.log(`All playlists processed! ${successful} successful, ${failed} failed`);

  return processedResults;
}

/**
 * Save videos to a JSON file
 * @param {Array} videos - Array of video objects
 * @param {string} playlistId - The playlist ID for filename
 * @param {string} outputDir - The output directory path
 */
function saveVideosToFile(videos, playlistId, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a filename based on playlist ID
  const fileName = path.join(outputDir, `${playlistId}.json`);

  // Create the summary structure with total and result
  const summaryData = {
    total: videos.length,
    result: videos
  };

  // Save the summary data to a JSON file
  fs.writeFileSync(fileName, JSON.stringify(summaryData, null, 2));

  console.log(`Saved ${videos.length} videos from playlist ${playlistId} to ${fileName}`);
  return fileName;
}

module.exports = {
  fetchPlaylistVideos,
  fetchMultiplePlaylists,
  saveVideosToFile
};
