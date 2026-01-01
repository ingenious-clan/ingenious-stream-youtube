# Scripts

This directory contains utility scripts for managing the movie database.

## fetch-tamil-movies.js

Fetches Tamil movies from YouTube using browser automation (Puppeteer). No API key required!

### Prerequisites

1. **Node.js**: Version 14 or higher
2. **npm**: Comes with Node.js

### Installation

Install dependencies:

```bash
npm install
```

This will install Puppeteer, which includes a bundled Chromium browser.

### Usage

Run the fetch script:

```bash
npm run fetch
```

Or directly:

```bash
node scripts/fetch-tamil-movies.js
```

### Configuration

You can customize the following parameters in the script:

- `MAX_RESULTS_PER_KEYWORD`: Number of results to fetch per keyword (default: 20)
- `DELAY_BETWEEN_SEARCHES`: Delay between searches in ms (default: 3000)
- `SCROLL_DELAY`: Delay for page content to load in ms (default: 2000)

### Output

The script will:
- Search YouTube using keywords from `search-keywords/tamil.txt`
- Parse video metadata
- Save each movie as a JSON file in `output/`
- Create a summary file `output/_summary.json`

### Search Keywords

Edit `search-keywords/tamil.txt` to customize search terms. Each line should contain one search keyword.

### How It Works

The script uses Puppeteer to:
1. Launch a headless Chrome browser
2. Navigate to YouTube search pages for each keyword
3. Filter for long-duration videos (movies)
4. Scrape video metadata from search results
5. Save unique movies to JSON files

No API key or quota limits!

### Example Output

```json
{
  "id": "vedalam",
  "name": "Vedalam",
  "language": "tamil",
  "videoId": "nqgQwsxeFYY",
  "description": "A doting brother who works as a cab driver...",
  "director": "",
  "year": 2015,
  "writer": "",
  "stars": [],
  "isActive": true,
  "channelTitle": "Tamil Movies Channel",
  "publishedAt": "2023-01-15T10:30:00Z"
}
```

### Manual Enrichment

After fetching, you'll need to manually add:
- Director name
- Writer name
- Stars array
- Better descriptions

Compare with existing files in the `movies/` directory for reference.
