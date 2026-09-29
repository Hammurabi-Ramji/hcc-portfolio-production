/**
 * Basic Web Scraper Example
 * Demonstrates how to scrape data from a website
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * Scrape a website and extract data
 * @param {string} url - URL to scrape
 * @param {object} selectors - CSS selectors for data extraction
 * @returns {array} Array of scraped data
 */
async function basicScraper(url, selectors) {
  try {
    console.log(`🕷️  Starting scrape of ${url}`);
    
    // Fetch the page
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✓ Page fetched (${response.status})`);
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Extract data using selectors
    $(selectors.container).each((index, element) => {
      const item = {};
      
      for (const [key, selector] of Object.entries(selectors.fields)) {
        item[key] = $(element).find(selector).text().trim();
      }
      
      if (Object.values(item).some(v => v)) {  // Only add if not empty
        results.push(item);
      }
    });
    
    console.log(`✓ Extracted ${results.length} items`);
    
    return results;
  } catch (error) {
    console.error(`✗ Error scraping ${url}:`, error.message);
    throw error;
  }
}

/**
 * Example: Scrape ecommerce products
 */
async function scrapeProducts() {
  const url = 'https://example-ecommerce.com/products';
  
  const selectors = {
    container: '.product-item',
    fields: {
      title: '.product-title',
      price: '.product-price',
      rating: '.product-rating',
      image: 'img.product-image'
    }
  };
  
  const products = await basicScraper(url, selectors);
  
  // Save results
  fs.writeFileSync(
    'products.json',
    JSON.stringify(products, null, 2)
  );
  
  console.log('✓ Results saved to products.json');
  return products;
}

/**
 * Example: Scrape news articles
 */
async function scrapeNews() {
  const url = 'https://example-news.com/latest';
  
  const selectors = {
    container: 'article.news-item',
    fields: {
      headline: 'h2.article-title',
      summary: '.article-summary',
      author: '.article-author',
      date: 'time.article-date',
      link: 'a.article-link'
    }
  };
  
  const articles = await basicScraper(url, selectors);
  
  fs.writeFileSync(
    'news.json',
    JSON.stringify(articles, null, 2)
  );
  
  console.log('✓ News articles saved to news.json');
  return articles;
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      console.log('Running OpenClaw Basic Scraper Examples...\n');
      
      // Uncomment to run examples:
      // await scrapeProducts();
      // await scrapeNews();
      
      console.log('\n✓ Examples completed');
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { basicScraper, scrapeProducts, scrapeNews };
