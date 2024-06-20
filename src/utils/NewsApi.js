import axios from 'axios';

const NEWS_API_CONFIG = {
  baseURL: 'https://newsapi.org/v2/everything?q=',
  pageSize: 10,
};

async function fetchNewsForCondition(condition) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY is not defined in environment variables');
  }
  const url = `${NEWS_API_CONFIG.baseURL}${encodeURIComponent(condition)}&pageSize=${NEWS_API_CONFIG.pageSize}&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.articles.filter(article => article.content && article.content !== "[Removed]");
  } catch (error) {
    console.error(`Error fetching news for ${condition}:`, error);
    throw new Error(`Failed to fetch news for condition: ${condition}`);
  }
}

export { fetchNewsForCondition };