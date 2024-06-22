import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function scrapeConditionsList() {
  const baseUrl = 'https://www.nhs.uk/conditions/';
  try {
    const { data: html } = await axios.get(baseUrl, { timeout: 5000 });
    const $ = cheerio.load(html);

    const conditionsList = $('.nhsuk-list.nhsuk-list--border').map((i, el) => {
      const items = $(el).find('li').map((index, item) => {
        // Extract the href attribute of the a tag
        const href = $(item).find('a').attr('href');
        // Check if href contains any of the excluded keywords
        if (!href.includes('mental-health') && !href.includes('vaccination') && !href.includes('contraception')) {
          // Remove '/conditions/' at the start and '/' at the end
          return href.replace(/^\/conditions\//, '').replace(/\/$/, '');
        }
        return null; // Return null for excluded items
      }).get().filter(href => href !== null); // Filter out null values
      return items;
    }).get();

    // Convert the conditions list to JSON format
    const conditionsJson = JSON.stringify(conditionsList, null, 2);

    // Write the JSON to a file
    await fs.writeFile('conditionsList.json', conditionsJson, 'utf8');

    console.log('Conditions list has been saved to conditionsList.json');
  } catch (error) {
    console.error(`Error scraping conditions list from ${baseUrl}:`, error);
    throw new Error('Failed to scrape conditions list');
  }
}

scrapeConditionsList().catch(console.error);