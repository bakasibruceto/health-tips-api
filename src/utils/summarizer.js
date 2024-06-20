export function summarizeText(text, numSentences) {
    const sentences = splitIntoSentences(text);
    const wordFrequencies = {};
    sentences.forEach(sentence => {
        filterStopWords(sentence).split(' ').forEach(word => {
            const wordLower = word.toLowerCase();
            if (wordLower in wordFrequencies) wordFrequencies[wordLower]++;
            else wordFrequencies[wordLower] = 1;
        });
    });

    const sentenceScores = sentences.map(sentence => {
        const words = filterStopWords(sentence).split(' ');
        const score = words.reduce((acc, word) => acc + (wordFrequencies[word.toLowerCase()] || 0), 0);
        return { sentence, score };
    });

    return sentenceScores.sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .map(item => item.sentence)
        .join(' ');
}

function splitIntoSentences(text) {
    // Simple regex to split text into sentences
    return text.match(/[^\.!\?]+[\.!\?]+/g) || [];
}

function filterStopWords(sentence) {
    const punctuation = /[.,/#!$%^&*;:{}=\-_`~()]/g;
    const stopWords = new Set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're",
        "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him',
        'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its',
        'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who',
        'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
        'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
        'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
        'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
        'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
        'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        's', 't', 'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd',
        'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn',
        "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't",
        'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't",
        'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won',
        "won't", 'wouldn', "wouldn't"
    ]);

    return sentence.split(' ')
        .map(word => word.toLowerCase().replace(punctuation, '')) // Convert to lowercase and remove punctuation
        .filter(word => !stopWords.has(word))
        .join(' ');
}