// import { fetchNewsForCondition } from './NewsApi.js';
// import { scrapeArticleContent } from './scraper.js';

import { fetchNewsForCondition, scrapeArticleContent } from '../index.js';

const dictionary = ['whooping cough', 'pertussis', 'coughing fits', 'Bordetella pertussis', 'vaccine', 'antibiotics', 'respiratory infection', 'coughing spells', 'whoop sound', 'infants', 'children', 'contagious', 'DTaP vaccine', 'Tdap vaccine'];

export async function findBestSourceForCondition(condition) {
    try {
        const articles = await fetchNewsForCondition(condition);
        if (!articles) throw new Error('No articles fetched');
        
        const articleUrls = articles.map(article => article.url);
        const scrapedContents = await Promise.all(articleUrls.map(url => scrapeArticleContent(url)));

        let bestArticle = null;
        let maxKeywordCount = 0;
        scrapedContents.forEach(article => {
            const keywordCount = dictionary.reduce((count, keyword) => {
                return count + (article.summary.includes(keyword) ? 1 : 0);
            }, 0);

            if (keywordCount > maxKeywordCount) {
                bestArticle = article;
                maxKeywordCount = keywordCount;
            }
        });

        if (!bestArticle) throw new Error('No best article found');
        return bestArticle;
    } catch (error) {
        console.error('Error finding the best source:', error);
        throw error;
    }
}