import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
const app = express();
const port = 3000;

import { fetchNewsForCondition, scrapeArticleContent, findBestSourceForCondition, scrapeMultipleArticles } from './utils/index.js';

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.get('/news', async (req, res) => {
  const condition = "cancer";
  if (!condition) {
    return res.status(400).send({ error: 'A condition query parameter is required' });
  }
  const articles = await fetchNewsForCondition(condition);
  // Assuming each article has a 'url' property, extract these into an array
  const urls = articles.map(article => article.url);
  res.json(urls); // Send the array of URLs as the response
});

app.post('/scrape', async (req, res) => {
  const { articleUrls } = req.body;
  if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
    return res.status(400).send({ error: 'Article URLs are required and must be a non-empty array.' });
  }

  try {
    // Use scrapeMultipleArticles to handle all URLs concurrently
    const { scrapedArticles, errors } = await scrapeMultipleArticles(articleUrls);

    console.log('Scraping errors:', errors); // Log errors for debugging
    res.send({ contents: scrapedArticles, errors });
  } catch (error) {
    console.error('Unexpected error during scraping process:', error);
    res.status(500).send({ error: 'An unexpected error occurred during the scraping process.' });
  }
});

app.get('/fetchAndScrape', async (req, res) => {
  // Reuse the logic from the /news endpoint
  const condition = "cancer symptoms"; // This should ideally come from the request, e.g., req.query.condition
  if (!condition) {
    return res.status(400).send({ error: 'A condition query parameter is required' });
  }
  const articles = await fetchNewsForCondition(condition);
  const articleUrls = articles.map(article => article.url);

  // Check if URLs were successfully fetched
  if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
    return res.status(400).send({ error: 'Failed to fetch article URLs or no articles found.' });
  }

  // Reuse the logic from the /scrape endpoint
  try {
    const { scrapedArticles, errors } = await scrapeMultipleArticles(articleUrls);
    console.log('Scraping errors:', errors); // Log errors for debugging
    res.send({ contents: scrapedArticles, errors });
  } catch (error) {
    console.error('Unexpected error during scraping process:', error);
    res.status(500).send({ error: 'An unexpected error occurred during the scraping process.' });
  }
});

app.post('/findBestSource', async (req, res) => {
    try {
        const { condition } = req.body;
        if (!condition) {
            return res.status(400).send({ error: 'Condition is required' });
        }

        // Before calling findBestSourceForCondition, ensure condition is valid
        // Example: if(typeof condition !== 'string') { throw new Error('Condition must be a string'); }

        const bestArticle = await findBestSourceForCondition(condition);
        // Consider adding more checks here, e.g., if(!bestArticle) { throw new Error('No article found'); }
        res.send(bestArticle);
    } catch (error) {
        console.error('API error:', error);
        // Consider enhancing error logging for better diagnostics
        res.status(500).send({ error: 'Failed to find the best source' });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});