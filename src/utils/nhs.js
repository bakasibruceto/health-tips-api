import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { scrapeArticleContent } from './scraper.js';
dotenv.config();

export const fetchHealthAZData = async (condition) => {
  const url = `https://api.nhs.uk/live-well/${encodeURIComponent(condition)}`;
  const options = {
    method: 'GET',
    headers: {
      'subscription-key': process.env.NHS_API_KEY, // Ensure this key is securely managed
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    const extractedData = extractUrlsAndHeadlines(data);
    // console.log(extractedData);
    // Randomly select an article to scrape
    const randomArticle = getRandomArticle(extractedData);
    const articleContent = await scrapeArticleContent(randomArticle.url);
    console.log(articleContent);
    // Optionally, write the extracted URLs and headlines to a JSON file
    // await fs.writeFile('healthData.json', JSON.stringify(extractedData, null, 2), 'utf-8');
    // console.log('Data saved to healthData.json');

    return articleContent;
  } catch (error) {
    console.error('Failed to fetch Health A-Z data:', error);
  }
};

// Function to extract URLs and headlines from the API response and store them in an array
function extractUrlsAndHeadlines(apiResponse) {
  const result = [];

  if (apiResponse.mainEntityOfPage && Array.isArray(apiResponse.mainEntityOfPage)) {
    apiResponse.mainEntityOfPage.forEach(mainEntity => {
      if (mainEntity.mainEntityOfPage && Array.isArray(mainEntity.mainEntityOfPage)) {
        mainEntity.mainEntityOfPage.forEach(webPageElement => {
          result.push({
            url: webPageElement.url,
            headline: webPageElement.headline
          });
        });
      }
    });
  }

  return result;
}

// Function to randomly select an article from the extracted data
function getRandomArticle(extractedData) {
  const randomIndex = Math.floor(Math.random() * extractedData.length);
  return extractedData[randomIndex];
}

// Example usage
// (async () => {
//   try {
//     await fetchHealthAZData('exercise');
//   } catch (error) {
//     console.error('Error running fetchHealthAZData:', error);
//   }
// })();