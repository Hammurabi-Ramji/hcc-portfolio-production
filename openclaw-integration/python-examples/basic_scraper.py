#!/usr/bin/env python3
"""
Basic Web Scraper Example
Demonstrates how to scrape data from a website using Python
"""

import requests
from bs4 import BeautifulSoup
import json
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OpenClawScraper:
    """Simple web scraper using BeautifulSoup"""
    
    def __init__(self, timeout=30, headers=None):
        self.timeout = timeout
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape(self, url: str, selectors: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Scrape data from URL using CSS selectors
        
        Args:
            url: URL to scrape
            selectors: Dict with 'container' and 'fields' keys
                      containing CSS selectors
        
        Returns:
            List of extracted data items
        """
        try:
            logger.info(f"🕷️  Scraping: {url}")
            
            # Fetch page
            response = requests.get(
                url,
                timeout=self.timeout,
                headers=self.headers
            )
            response.raise_for_status()
            
            logger.info(f"✓ Page fetched ({response.status_code})")
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            results = []
            
            # Extract data
            containers = soup.select(selectors['container'])
            logger.info(f"Found {len(containers)} items")
            
            for container in containers:
                item = {}
                for key, selector in selectors.get('fields', {}).items():
                    element = container.select_one(selector)
                    item[key] = element.get_text(strip=True) if element else None
                
                # Add item if it has data
                if any(item.values()):
                    results.append(item)
            
            logger.info(f"✓ Extracted {len(results)} items")
            return results
            
        except requests.RequestException as e:
            logger.error(f"✗ Request error: {e}")
            raise
        except Exception as e:
            logger.error(f"✗ Scraping error: {e}")
            raise
    
    def save_json(self, data: List[Dict], filename: str) -> None:
        """Save data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"✓ Saved to {filename}")
        except Exception as e:
            logger.error(f"✗ Error saving file: {e}")
            raise


def scrape_products() -> List[Dict]:
    """Example: Scrape ecommerce products"""
    scraper = OpenClawScraper()
    
    url = 'https://example-ecommerce.com/products'
    selectors = {
        'container': '.product-item',
        'fields': {
            'title': '.product-title',
            'price': '.product-price',
            'rating': '.product-rating',
            'image_url': 'img.product-image::attr(src)'
        }
    }
    
    products = scraper.scrape(url, selectors)
    scraper.save_json(products, 'products.json')
    
    return products


def scrape_news() -> List[Dict]:
    """Example: Scrape news articles"""
    scraper = OpenClawScraper()
    
    url = 'https://example-news.com/latest'
    selectors = {
        'container': 'article.news-item',
        'fields': {
            'headline': 'h2.article-title',
            'summary': '.article-summary',
            'author': '.article-author',
            'date': 'time.article-date::attr(datetime)',
            'link': 'a.article-link::attr(href)'
        }
    }
    
    articles = scraper.scrape(url, selectors)
    scraper.save_json(articles, 'news.json')
    
    return articles


def scrape_multiple(targets: List[Dict]) -> List[Dict]:
    """Scrape multiple targets"""
    scraper = OpenClawScraper()
    all_results = []
    
    for target in targets:
        try:
            results = scraper.scrape(target['url'], target['selectors'])
            all_results.extend(results)
            logger.info(f"✓ Scraped {target['name']}")
        except Exception as e:
            logger.error(f"✗ Failed to scrape {target['name']}: {e}")
    
    return all_results


if __name__ == '__main__':
    logger.info('Starting OpenClaw Python Scraper Examples...\n')
    
    try:
        # Uncomment to run examples:
        # products = scrape_products()
        # news = scrape_news()
        
        logger.info('\n✓ Examples completed')
    except Exception as e:
        logger.error(f'Error: {e}')
        exit(1)
