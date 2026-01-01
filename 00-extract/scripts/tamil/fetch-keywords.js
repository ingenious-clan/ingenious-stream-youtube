const fs = require("fs");
const path = require("path");

// Read the keywords from tamil.txt
const keywordsFilePath = path.join(__dirname, "../../constants/keywords/tamil.txt");
const keywords = fs.readFileSync(keywordsFilePath, "utf8")
  .split("\n")
  .map(keyword => keyword.trim())
  .filter(keyword => keyword.length > 0);

// Directory to save keyword search results
const outputDir = path.join(__dirname, "../../output/tamil/keywords");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to fetch videos based on keywords
async function fetchKeywordVideos(keyword) {
  try {
    console.log(`Searching for videos with keyword: ${keyword}`);

    // This is a placeholder implementation
    // In a real implementation, you would use an API or web scraping to find videos
    // For now, we'll simulate the process with mock data

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data - in a real implementation, this would come from an API
    const mockVideos = [
      {
        id: `mock_video_id_${Math.floor(Math.random() * 10000)}`,
        name: `${keyword} - Mock Video Title`,
        url: `https://www.youtube.com/watch?v=mock${Math.floor(Math.random() * 10000)}`,
      },
      {
        id: `mock_video_id_${Math.floor(Math.random() * 10000)}`,
        name: `${keyword} - Another Mock Video`,
        url: `https://www.youtube.com/watch?v=mock${Math.floor(Math.random() * 10000)}`,
      }
    ];

    // Create a filename based on keyword
    const fileName = path.join(outputDir, `${encodeURIComponent(keyword.replace(/[^a-zA-Z0-9]/g, "_"))}.json`);

    // Save the videos data to a JSON file
    fs.writeFileSync(fileName, JSON.stringify(mockVideos, null, 2));

    console.log(`Saved ${mockVideos.length} videos for keyword "${keyword}" to ${fileName}`);
    return mockVideos;
  } catch (error) {
    console.error(`Error processing keyword "${keyword}":`, error.message);

    // Create an empty result file even if there's an error
    const fileName = path.join(outputDir, `${encodeURIComponent(keyword.replace(/[^a-zA-Z0-9]/g, "_"))}.json`);
    fs.writeFileSync(fileName, JSON.stringify([], null, 2));
    return [];
  }
}

// Main function to process all keywords
async function fetchAllKeywords() {
  console.log(`Found ${keywords.length} keywords to process`);

  // Process all keywords concurrently for better performance
  const results = await Promise.allSettled(
    keywords.map(keyword => fetchKeywordVideos(keyword))
  );

  // Count successful and failed operations
  const successful = results.filter(result => result.status === "fulfilled").length;
  const failed = results.filter(result => result.status === "rejected").length;

  console.log(`All keywords processed! ${successful} successful, ${failed} failed`);
}

// Run the script
fetchAllKeywords().catch(console.error);
