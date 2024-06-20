import axios from 'axios';
import * as cheerio from 'cheerio';

import { summarizeText } from './summarizer.js';

export async function scrapeArticleContent(articleUrl) {
  try {
    // Set a timeout for the request
    const { data: html } = await axios.get(articleUrl, { timeout: 5000 }); // 5000 milliseconds = 5 seconds
    const $ = cheerio.load(html);

    const title = $('title').text().trim();
    let description = $('meta[name="description"]').attr("content") || $('p').first().text().trim();
    const paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
    let allText = paragraphs.join('\n\n');

    const summary = await summarizeText(allText, 5);

    return { title, description, summary, url: articleUrl };
  } catch (error) {
    console.error(`Error scraping article content for URL ${articleUrl}:`, error);
    throw new Error('Failed to scrape article content');
  }
}

const cache = new Map(); // Simple in-memory cache

export async function scrapeMultipleArticles(articleUrls, batchSize = 5) { 
  let index = 0;
  const total = articleUrls.length;
  const scrapedArticles = [];
  const errors = [];

  while (index < total) {
    const batch = articleUrls.slice(index, index + batchSize).filter(url => !cache.has(url)); // Filter out cached URLs
    const results = await Promise.allSettled(batch.map(url => 
      cache.has(url) ? Promise.resolve(cache.get(url)) : scrapeArticleContent(url)
    ));
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        scrapedArticles.push(result.value);
        cache.set(batch[results.indexOf(result)], result.value); // Cache successful results
      } else {
        errors.push(result.reason);
      }
    });
    index += batchSize;
  }

  return { scrapedArticles, errors };
}