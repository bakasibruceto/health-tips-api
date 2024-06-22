import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
import cors from 'cors';
app.use(cors());

import { fetchHealthAZData } from './utils/index.js';

 // Middleware to parse JSON bodies

// Assuming fetchHealthAZData is correctly imported or defined above this snippet

app.get('/data', async (req, res) => {
  try {
    // Fetch articles data
    const articles = await fetchHealthAZData('sexual-health');
    
    // Check if articles is not null, undefined, or empty
    if (!articles || articles.length === 0) {
      return res.status(404).send('No articles found');
    }

    // Send processed articles as JSON
    res.json(articles);
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    res.status(500).send('Failed to fetch articles');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});