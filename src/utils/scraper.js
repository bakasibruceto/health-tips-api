import axios from 'axios';
import * as cheerio from 'cheerio';

import { summarizeText } from './summarizer.js';

export async function scrapeArticleContent(articleUrl) {
  try {
    const { data: html } = await axios.get(articleUrl);
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