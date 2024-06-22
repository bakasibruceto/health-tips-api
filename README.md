# API Used
- [NHS](https://developer.api.nhs.uk/nhs-api)
# Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

# Installation
```bash
#Create Virutal Environment
py -m venv .venv

#Active .venv
.\.venv\Scripts\Activate

#Install dependencies
pip install Flask Flask-CORS lxml_html_clean nltk python-dotenv requests setuptools sumy
```

# Run
```bash
flask run
```
     