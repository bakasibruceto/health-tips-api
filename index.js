require('dotenv').config();
const cheerio = require('cheerio');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const RSS = require('rss');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies


const healthConditions = ["Acne", "covid"];

async function scrapeArticleContent(articleUrl) {
  try {
    // Fetch the HTML content of the page
    const { data: html } = await axios.get(articleUrl);

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Extract the first paragraph of content
    let allText = '';
    $('p').each(function () {
      allText += $(this).text() + ' ';
    });

    return allText;
  } catch (error) {
    console.error('Error scraping article content:', error);
    return null;
  }
}


async function fetchNewsForCondition(condition) {
  const apiKey = process.env.NEWS_API_KEY; // Use environment variable for API key
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(condition)}&pageSize=1&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articlesWithContent = response.data.articles.filter(article => article.content !== null & article.content !== "[Removed]");


    return articlesWithContent;
  } catch (error) {
    console.error(`Error fetching news for ${condition}:`, error);
    return [];
  }
}

app.get('/news', async (req, res) => {
  const condition = req.query.condition;
  if (!condition) {
    return res.status(400).send({ error: 'A condition query parameter is required' });
  }
  const articles = await fetchNewsForCondition(condition);
  res.json(articles);
});

async function generateRSSFeed() {
  const feed = new RSS({
    title: 'Health News',
    description: 'Latest news on various health conditions',
    feed_url: 'http://localhost:3000/rss.xml',
    site_url: 'http://localhost:3000',
  });

  for (const condition of healthConditions) {
    let articles = await fetchNewsForCondition(condition);
    articles = articles.filter(article => article.content !== null);

    for (const article of articles) {
      feed.item({
        title: article.title,
        description: article.description,
        url: article.url,
        author: article.author,
        date: article.publishedAt,
      });
    }
  }

  return feed.xml();
}

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

app.get('/rss', async (req, res) => {
  const rss = await generateRSSFeed();
  res.header('Content-Type', 'application/rss+xml');
  res.send(rss);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});