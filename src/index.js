import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());
import cors from 'cors';
app.use(cors());

import { fetchHealthAZData } from './utils/index.js';


async function fetchHealthTips(condition) {
  const url = "http://127.0.0.1:5000/get_condition?condition=";
  const data = {
    condition: condition
  };

  try {
    const response = await fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.json();
    console.log(content);
    // Process the content here
  } catch (error) {
    console.error('Error fetching health tips:', error);
  }
}

// Example usage
fetchHealthTips();


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