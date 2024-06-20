// import { fetchNewsForCondition } from './NewsApi.js';
// import { scrapeArticleContent } from './scraper.js';

import { fetchNewsForCondition, scrapeArticleContent } from './index.js';

const dictionary = ['whooping cough', 'pertussis', 'coughing fits', 'Bordetella pertussis', 'vaccine', 'antibiotics', 'respiratory infection', 'coughing spells', 'whoop sound', 'infants', 'children', 'contagious', 'DTaP vaccine', 'Tdap vaccine'];

export async function findBestSourceForCondition(condition) {
    try {
        // Step 1: Fetch articles
        const articles = await fetchNewsForCondition(condition);
        const articleUrls = articles.map(article => article.url);

        // Step 2: Scrape content for each article
        const scrapedContents = await Promise.all(articleUrls.map(url => scrapeArticleContent(url)));

        // Step 3: Score each article based on its content
        let bestArticle = null;
        let maxKeywordCount = 0;
        scrapedContents.forEach(article => {
            // Here, you might want to score the article.summary or the entire article content
            const keywordCount = dictionary.reduce((count, keyword) => {
                return count + (article.summary.includes(keyword) ? 1 : 0);
            }, 0);

            if (keywordCount > maxKeywordCount) {
                bestArticle = article; // Keep the entire article as the best one
                maxKeywordCount = keywordCount;
            }
        });

        // Step 4: Return the best article
        return bestArticle;
    } catch (error) {
        console.error('Error finding the best source:', error);
        throw error;
    }
}