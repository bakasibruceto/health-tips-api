# API Used
- [NHS](https://developer.api.nhs.uk/nhs-api)
# Setup
```bash
cp .env.example .env
```

# Installation


```bash
py -m venv .venv
```

```bash
.\.venv\Scripts\Activate
```

```bash
pip install fastapi nltk numpy pydantic python-dotenv requests setuptools sumy uvcorn     
```

# Run
```bash
uvicorn main:app --reload
```

# Summarizer
### methods
`LSA`
`text-rank`
`lex-rank` 
`edmudson` 
`luhn`
`kl-sum`
`random`
`reduction`

### inputType
`text` `URL`
 
### sample api call - Summarizer

```bash
function summarizeText(
  method: string, 
  language: string, 
  sentenceCount: number 
  inputType: string, 
  inputText: string
): void {
  const apiUrl = 'http://localhost:5000/summarize';
  const data = {
    data: [method, language, sentenceCount, inputType, inputText]
  };
  
  fetch(apiUrl, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(data) 
  })
    .then(response => response.text()) 
    .then(summary => {
      console.log('Summary:', summary);
    })
    .catch(error => {
      console.error('Error:', error); 
    });
}

// Sample
summarizeText('lex-rank', 'english', 5, 'URL', 'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/');

```
