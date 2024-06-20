import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
const app = express();
const port = 3000;

import { fetchNewsForCondition } from './utils/NewsApi.js';
import { scrapeArticleContent } from './utils/scraper.js';

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.get('/news', async (req, res) => {
  const condition = req.query.condition;
  if (!condition) {
    return res.status(400).send({ error: 'A condition query parameter is required' });
  }
  const articles = await fetchNewsForCondition(condition);
  res.json(articles);
});


app.post('/scrape', async (req, res) => {
  const { articleUrl } = req.body;
  if (!articleUrl) {
    return res.status(400).send({ error: 'Article URL is required' });
  }

  try {
    const content = await scrapeArticleContent(articleUrl);
    res.send({ content });
  } catch (error) {
    res.status(500).send({ error: 'Failed to scrape article content' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});