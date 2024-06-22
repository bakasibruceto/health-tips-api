app.get('/news', async (req, res) => {
    const condition = req.query.condition;
    if (!condition) {
      return res.status(400).send({ error: 'A condition query parameter is required' });
    }
    const articles = await fetchNewsForCondition(condition);
    // Modify here to include more details instead of just URLs
    const detailedArticles = articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url
    }));
    res.json(detailedArticles); // Send the detailed articles as the response
  });
  
  app.post('/scrape', async (req, res) => {
    const { articleUrls } = req.body;
    if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
      return res.status(400).send({ error: 'Article URLs are required and must be a non-empty array.' });
    }
  
    try {
      // Use scrapeMultipleArticles to handle all URLs concurrently
      const { scrapedArticles, errors } = await scrapeMultipleArticles(articleUrls);
  
      console.log('Scraping errors:', errors); // Log errors for debugging
      res.send({ contents: scrapedArticles, errors });
    } catch (error) {
      console.error('Unexpected error during scraping process:', error);
      res.status(500).send({ error: 'An unexpected error occurred during the scraping process.' });
    }
  });
  
  app.get('/fetchAndScrape', async (req, res) => {
    // Reuse the logic from the /news endpoint
    const condition = "cancer symptoms"; // This should ideally come from the request, e.g., req.query.condition
    if (!condition) {
      return res.status(400).send({ error: 'A condition query parameter is required' });
    }
    const articles = await fetchNewsForCondition(condition);
    const articleUrls = articles.map(article => article.url);
  
    // Check if URLs were successfully fetched
    if (!articleUrls || !Array.isArray(articleUrls) || articleUrls.length === 0) {
      return res.status(400).send({ error: 'Failed to fetch article URLs or no articles found.' });
    }
  
    // Reuse the logic from the /scrape endpoint
    try {
      const { scrapedArticles, errors } = await scrapeMultipleArticles(articleUrls);
      console.log('Scraping errors:', errors); // Log errors for debugging
      res.send({ contents: scrapedArticles, errors });
    } catch (error) {
      console.error('Unexpected error during scraping process:', error);
      res.status(500).send({ error: 'An unexpected error occurred during the scraping process.' });
    }
  });
  
  app.post('/generateKeywords', async (req, res) => {
    const condition = "whooping"; // Assuming the condition is sent in the request body instead of being hardcoded
    try {
      const keywordsArray = await generateKeywordArray(condition);
      res.json({ condition, keywordsArray }); // Send the condition and keywords array back to the client
    } catch (error) {
      console.error('Error generating keywords:', error);
      res.status(500).send({ error: 'Failed to generate keywords for the given condition.' });
    }
  });
  