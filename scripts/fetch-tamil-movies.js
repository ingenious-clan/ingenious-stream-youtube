const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const KEYWORDS_FILE = path.join(__dirname, '../search-keywords/tamil.txt');
const OUTPUT_DIR = path.join(__dirname, '../output');
const MAX_RESULTS_PER_KEYWORD = 20;
const DELAY_BETWEEN_SEARCHES = 3000; // 3 second delay between searches
const SCROLL_DELAY = 2000; // 2 second delay for page to load content

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Search YouTube using browser automation
 */
async function youtubeSearch(browser, keyword, maxResults = 20) {
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Construct search URL with filters for long videos (movies)
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=EgQQARgB`;

  console.log(`  Navigating to: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for video results to load
  await page.waitForSelector('ytd-video-renderer', { timeout: 10000 });

  // Scroll to load more results
  await autoScroll(page);

  // Extract video data
  const videos = await page.evaluate(() => {
    const videoElements = document.querySelectorAll('ytd-video-renderer');
    const results = [];

    videoElements.forEach((video) => {
      try {
        const titleElement = video.querySelector('#video-title');
        const channelElement = video.querySelector('#channel-name a');
        const descElement = video.querySelector('#description-text');
        const metaElement = video.querySelector('#metadata-line');

        if (!titleElement) return;

        const videoId = titleElement.getAttribute('href')?.split('v=')[1]?.split('&')[0];
        if (!videoId) return;

        const title = titleElement.getAttribute('title') || titleElement.textContent.trim();
        const channelName = channelElement?.textContent.trim() || '';
        const description = descElement?.textContent.trim() || '';

        // Get thumbnail
        const thumbnailElement = video.querySelector('img#img');
        const thumbnail = thumbnailElement?.src || '';

        // Get duration
        const durationElement = video.querySelector('ytd-thumbnail-overlay-time-status-renderer span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
        const duration = durationElement?.textContent.trim() || '';

        results.push({
          videoId,
          title,
          channelName,
          description,
          thumbnail,
          duration
        });
      } catch (error) {
        console.error('Error parsing video:', error);
      }
    });

    return results;
  });

  await page.close();

  // Filter videos by duration (only keep videos >= 60 minutes)
  const filteredVideos = videos.filter(video => {
    const durationMinutes = parseDurationToMinutes(video.duration);
    return durationMinutes >= 60;
  });

  console.log(`    Filtered: ${filteredVideos.length}/${videos.length} videos are >= 60 minutes`);

  return filteredVideos.slice(0, maxResults);
}

/**
 * Auto scroll to load more videos
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });

  // Wait for new content to load
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Parse duration string to minutes
 * Examples: "1:30:45" -> 90.75, "45:30" -> 45.5, "5:00" -> 5
 */
function parseDurationToMinutes(duration) {
  if (!duration) return 0;

  const parts = duration.split(':').map(p => parseInt(p) || 0);

  if (parts.length === 3) {
    // Format: H:MM:SS
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  } else if (parts.length === 2) {
    // Format: M:SS or H:MM
    return parts[0] + parts[1] / 60;
  } else if (parts.length === 1) {
    // Format: S
    return parts[0] / 60;
  }

  return 0;
}

/**
 * Extract year from video title or description
 */
function extractYear(text) {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
}

/**
 * Generate movie ID from title
 */
function generateMovieId(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Parse movie data from YouTube video
 */
function parseMovieData(video) {
  const title = video.title.replace(/\s*(full movie|hd|tamil|movie|official)\s*/gi, '').trim();

  const movieData = {
    id: generateMovieId(title),
    name: title,
    language: 'tamil',
    videoId: video.videoId,
    description: video.description.split('\n')[0].substring(0, 200) || 'No description available',
    director: '',
    year: extractYear(video.title + ' ' + video.description),
    writer: '',
    stars: [],
    isActive: true,
    channelTitle: video.channelName,
    thumbnail: video.thumbnail,
    duration: video.duration,
    durationMinutes: parseDurationToMinutes(video.duration)
  };

  return movieData;
}

/**
 * Read keywords from file
 */
function readKeywords() {
  const content = fs.readFileSync(KEYWORDS_FILE, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Save batch of movies for a keyword
 */
function saveBatch(keyword, movies) {
  const filename = `${generateKeywordId(keyword)}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const batchData = {
    keyword,
    totalMovies: movies.length,
    fetchedAt: new Date().toISOString(),
    movies: movies
  };

  fs.writeFileSync(filepath, JSON.stringify(batchData, null, 2));
  console.log(`✓ Saved batch: ${movies.length} movies for "${keyword}"`);
}

/**
 * Generate keyword ID for filename
 */
function generateKeywordId(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to fetch Tamil movies
 */
async function fetchTamilMovies() {
  console.log('Starting Tamil movies fetch using browser automation...\n');

  // Read keywords
  const keywords = readKeywords();
  console.log(`Found ${keywords.length} search keywords\n`);

  const allMovies = new Map();
  let browser;

  try {
    // Launch browser
    console.log('Launching browser...\n');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    // Search for each keyword
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`[${i + 1}/${keywords.length}] Searching: "${keyword}"`);

      try {
        const searchResults = await youtubeSearch(browser, keyword, MAX_RESULTS_PER_KEYWORD);

        if (searchResults && searchResults.length > 0) {
          const keywordMovies = [];

          for (const video of searchResults) {
            const movieData = parseMovieData(video);

            // Avoid duplicates in global set by videoId
            if (!allMovies.has(movieData.videoId)) {
              allMovies.set(movieData.videoId, movieData);
              keywordMovies.push(movieData);
            }
          }

          // Save batch for this keyword
          if (keywordMovies.length > 0) {
            saveBatch(keyword, keywordMovies);
          }

          console.log(`  Found ${searchResults.length} videos (${keywordMovies.length} new)\n`);
        } else {
          console.log('  No results found\n');
        }

        // Delay between searches
        if (i < keywords.length - 1) {
          console.log(`  Waiting ${DELAY_BETWEEN_SEARCHES}ms before next search...\n`);
          await delay(DELAY_BETWEEN_SEARCHES);
        }

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
      }
    }

    // Close browser
    await browser.close();

    // Create summary
    console.log('\n' + '='.repeat(50));
    console.log(`✓ Fetch complete!`);
    console.log(`  Total unique movies found: ${allMovies.size}`);
    console.log(`  Files saved to: ${OUTPUT_DIR}`);
    console.log('='.repeat(50));

    // Save summary file
    const summary = {
      fetchedAt: new Date().toISOString(),
      totalMovies: allMovies.size,
      keywords: keywords.length,
      movies: Array.from(allMovies.values()).map(m => ({
        id: m.id,
        name: m.name,
        videoId: m.videoId,
        year: m.year
      }))
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );

  } catch (error) {
    console.error('Fatal error:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fetchTamilMovies().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fetchTamilMovies, parseMovieData };
