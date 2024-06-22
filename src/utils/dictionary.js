import fetch from 'node-fetch';

export async function generateKeywordArray(parameter) {
  const words = parameter.split(/\s+/);
  const keywordArray = [];

  for (const word of words) {
    const lowerWord = word.toLowerCase();
    keywordArray.push({ term: lowerWord, weight: 1 });

    // Fetch multiple types of related terms including general related terms
    const responses = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_syn=${lowerWord}`),
      fetch(`https://api.datamuse.com/words?rel_ant=${lowerWord}`),
      fetch(`https://api.datamuse.com/words?rel_trg=${lowerWord}`),
      fetch(`https://api.datamuse.com/words?rel_gen=${lowerWord}`) // Fetching general related terms
    ]);
    const [synonyms, antonyms, triggers, related] = await Promise.all(responses.map(res => res.json()));

    // Adjust the number of terms and weights based on relevance
    synonyms.slice(0, 10).forEach(termObj => keywordArray.push({ term: termObj.word, weight: 0.75 }));
    antonyms.slice(0, 10).forEach(termObj => keywordArray.push({ term: termObj.word, weight: 0.25 }));
    triggers.slice(0, 10).forEach(termObj => keywordArray.push({ term: termObj.word, weight: 0.5 }));
    related.slice(0, 10).forEach(termObj => keywordArray.push({ term: termObj.word, weight: 0.6 })); // Example: Adjust for related terms
  }

  return keywordArray;
}

// Example usage
// (async () => {
//   const parameter = "pertussis symptoms";
//   const keywordArray = await generateKeywordArray(parameter);
//   console.log(keywordArray);
// })();