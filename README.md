# Ingenious Stream YouTube

A curated collection of YouTube-hosted movie metadata for streaming applications. This repository contains structured data about movies available on YouTube, organized by language and genre.

## Overview

This project provides a JSON-based database of movie information, including:
- Movie details (title, year, director, cast)
- YouTube video IDs for streaming
- Descriptions and metadata
- Language-based organization

## Project Structure

```
ingenious-stream-youtube/
├── movies/
│   ├── [movie-id].json          # Individual movie metadata files
│   └── language/
│       └── tamil/
│           └── _meta.json       # Index of all Tamil movies
├── scripts/
│   ├── fetch-tamil-movies.js    # YouTube API fetch script
│   └── README.md                # Scripts documentation
├── search-keywords/
│   └── tamil.txt                # Search keywords for Tamil movies
├── output/                      # Generated movie files (gitignored)
└── README.md
```

## Data Format

### Individual Movie File (`movies/[movie-id].json`)

Each movie has its own JSON file containing detailed metadata:

```json
{
  "id": "vedalam",
  "name": "Vedalam",
  "videoId": "nqgQwsxeFYY",
  "description": "A doting brother who works as a cab driver tries to hunt down three notorious criminals in Kolkata who had harmed his sister.",
  "director": "Siva",
  "year": 2015,
  "writer": "Siva, G. Adi Narayana, Md Parvez Hossain",
  "stars": ["Ajith Kumar", "Shruti Haasan", "Lakshmi Menon"],
  "isActive": true
}
```

### Language Meta File (`movies/language/[language]/_meta.json`)

Each language has a meta file that indexes all movies in that language:

```json
[
  {
    "id": "vedalam",
    "name": "Vedalam",
    "videoId": "nqgQwsxeFYY"
  },
  ...
]
```

## Available Movies

### Tamil Movies
- **Vedalam** (2015) - Directed by Siva
- **Thiruttu Payale 2** - Action Thriller
- **Lingaa** - Drama
- **Irumbu Thirai** - Cyber Thriller
- **Nenjuku Needhi** - Drama

## Usage

### Accessing Movie Data

1. **Get all movies by language:**
   ```javascript
   const tamilMovies = require('./movies/language/tamil/_meta.json');
   ```

2. **Get detailed movie information:**
   ```javascript
   const vedalam = require('./movies/vedalam.json');
   console.log(vedalam.name); // "Vedalam"
   console.log(vedalam.videoId); // "nqgQwsxeFYY"
   ```

3. **Stream on YouTube:**
   ```
   https://www.youtube.com/watch?v={videoId}
   ```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (kebab-case) |
| `name` | string | Movie title |
| `language` | string | Movie language (lowercase) |
| `videoId` | string | YouTube video ID |
| `description` | string | Movie synopsis |
| `director` | string | Director name(s) |
| `year` | number | Release year |
| `writer` | string | Writer name(s) |
| `stars` | array | Main cast members |
| `isActive` | boolean | Whether the movie is currently available |

## Automated Fetching

### Fetch Movies from YouTube

Use the fetch script to automatically discover Tamil movies on YouTube using browser automation (no API key needed):

```bash
# Install dependencies (first time only)
npm install

# Run the fetch script
npm run fetch
```

The script will:
- Launch a headless browser
- Search YouTube using keywords from `search-keywords/tamil.txt`
- Extract movie metadata from search results
- Save results to `output/` directory
- Generate a summary file

See [scripts/README.md](scripts/README.md) for detailed configuration options.

### Customizing Search Keywords

Edit `search-keywords/tamil.txt` to add or modify search terms:

```
tamil full movie
tamil action movie
tamil thriller movie
```

## Contributing

### Adding a New Movie Manually

1. Create a new JSON file in the `movies/` directory with the movie's ID as filename
2. Fill in all required fields following the data format above
3. Add the movie entry to the appropriate language meta file in `movies/language/[language]/_meta.json`
4. Ensure `isActive` is set to `true` if the YouTube video is available

### Adding Movies via Script

1. Run the fetch script (see Automated Fetching above)
2. Review generated files in `output/` directory
3. Manually enrich the data (add director, writers, stars)
4. Move completed files to `movies/` directory
5. Update the language meta file

### Guidelines

- Use kebab-case for movie IDs (e.g., `thiruttu-payale-2`)
- Verify YouTube video IDs are correct and active
- Include complete cast and crew information
- Write clear, concise descriptions
- Maintain alphabetical order in meta files

## License

This is a data repository. Please ensure all YouTube content is properly licensed and available for public viewing.

## Disclaimer

This repository contains metadata only. All video content is hosted on YouTube. Ensure you have proper rights and permissions for any content you add to this database.
