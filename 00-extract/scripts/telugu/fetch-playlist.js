const fs = require("fs");
const path = require("path");
const { fetchPlaylistVideos, saveVideosToFile } = require("../../helpers/sanishtech-apis");

// Read the playlist URLs from telugu-playlist.txt
const playlistFilePath = path.join(__dirname, "../../constants/playlist/telugu/telugu-playlist.txt");
const playlistUrls = fs.readFileSync(playlistFilePath, "utf8")
  .split("\n")
  .map(url => url.trim())
  .filter(url => url.startsWith("https://www.youtube.com/playlist"));

// Directory to save movie data
const outputDir = path.join(__dirname, "../../output/telugu/playlist");

// Main function to process all playlists
async function fetchAllPlaylists() {
  console.log(`Found ${playlistUrls.length} playlists to process`);

  // Process all playlists concurrently for better performance
  const results = await Promise.allSettled(
    playlistUrls.map(async (playlistUrl) => {
      const videos = await fetchPlaylistVideos(playlistUrl);
      // Extract playlist ID from the URL
      const playlistId = new URL(playlistUrl).searchParams.get("list");
      saveVideosToFile(videos, playlistId, outputDir);
      return videos;
    })
  );

  // Count successful and failed operations
  const successful = results.filter(result => result.status === "fulfilled").length;
  const failed = results.filter(result => result.status === "rejected").length;

  console.log(`All playlists processed! ${successful} successful, ${failed} failed`);
}

// Run the script
fetchAllPlaylists().catch(console.error);
