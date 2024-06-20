// feature proofing

async function fetchNewsForCondition(condition, websiteUrl) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY is not defined in environment variables');
  }
  // Encode the website URL for inclusion in the query
  const encodedWebsiteUrl = encodeURIComponent(websiteUrl);
  const url = `${NEWS_API_CONFIG.baseURL}${encodeURIComponent(condition)}&domains=${encodedWebsiteUrl}&pageSize=${NEWS_API_CONFIG.pageSize}&apiKey=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.articles.filter(article => article.content && article.content !== "[Removed]");
  } catch (error) {
    console.error(`Error fetching news for ${condition} from ${websiteUrl}:`, error);
    throw new Error(`Failed to fetch news for condition: ${condition} from website: ${websiteUrl}`);
  }
}