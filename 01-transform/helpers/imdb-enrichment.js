const axios = require("axios");
const cheerio = require("cheerio");

// Function to search for a movie on IMDB and get its details
async function getMovieDetailsFromIMDB(movieTitle) {
  try {
    // Clean the movie title for search
    const cleanTitle = movieTitle.replace(/\s*\([^)]*\)/g, "").trim(); // Remove year in parentheses
    const searchQuery = cleanTitle + " Tamil";
    const searchUrl = "https://www.imdb.com/find?q=" + encodeURIComponent(searchQuery) + "&s=tt&ttype=ft&ref_=fn_ft";
    
    console.log("Searching for movie: " + cleanTitle + " on IMDB");
    
    // Fetch the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Find the first movie result link
    const firstResult = $("div.findSection .result_text a").first();
    if (!firstResult.length) {
      console.log("No results found for: " + cleanTitle);
      return null;
    }
    
    const movieUrl = "https://www.imdb.com" + firstResult.attr("href");
    
    // Fetch the movie details page
    const movieResponse = await axios.get(movieUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    const $$ = cheerio.load(movieResponse.data);
    
    // Extract movie details
    const title = $$("h1").first().text().trim();
    let description = $$("div.sc-15baf581-0.cZVSDO > span").first().text().trim() || 
                     $$("div.sc-15baf581-0.cZVSDO > div > span").first().text().trim() ||
                     "No description available";
    
    // Extract year from title or release info
    let year = null;
    const titleMatch = title.match(/\((\d{4})\)/);
    if (titleMatch) {
      year = parseInt(titleMatch[1]);
    } else {
      const releaseInfo = $$("ul.ipc-inline-list li a[href*=releaseinfo]").first().text().trim();
      const yearMatch = releaseInfo.match(/(\d{4})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
    }
    
    // Extract director
    let director = "Unknown";
    $$("li.ipc-metadata-list__item").each((i, elem) => {
      const label = $$(elem).find("div.ipc-metadata-list-item__label").text().trim();
      if (label === "Director" || label === "Directors") {
        director = $$(elem).find("ul.ipc-inline-list li a").first().text().trim();
        return false; // break the loop
      }
    });
    
    // Extract writer
    let writer = "Unknown";
    $$("li.ipc-metadata-list__item").each((i, elem) => {
      const label = $$(elem).find("div.ipc-metadata-list-item__label").text().trim();
      if (label === "Writer" || label === "Writers") {
        writer = $$(elem).find("ul.ipc-inline-list li a").first().text().trim();
        return false; // break the loop
      }
    });
    
    // Extract stars (top 3)
    const stars = [];
    $$("li.ipc-metadata-list__item").each((i, elem) => {
      const label = $$(elem).find("div.ipc-metadata-list-item__label").text().trim();
      if (label === "Stars" || label === "Star") {
        $$(elem).find("ul.ipc-inline-list li a").each((j, star) => {
          if (j < 3) { // Limit to top 3 stars
            const starName = $$(star).text().trim();
            if (starName && starName !== "See full cast & crew") {
              stars.push(starName);
            }
          }
        });
        return false; // break the loop
      }
    });
    
    return {
      title: title,
      description: description,
      director: director,
      year: year,
      writer: writer,
      stars: stars
    };
  } catch (error) {
    console.error("Error fetching details for " + movieTitle + " from IMDB:", error.message);
    return null;
  }
}

module.exports = {
  getMovieDetailsFromIMDB
};
