from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sumy.parsers.plaintext import PlaintextParser
from sumy.parsers.html import HtmlParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
import nltk
import os
import requests
import random
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, List

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration
from config import Config
app.config = Config()

# Ensure NLTK resources are downloaded
@app.on_event("startup")
async def download_nltk_resources():
    nltk.download("punkt")

class SummarizeRequest(BaseModel):
    data: List[Optional[str]]

@app.get("/")
async def index():
    return {"message": "Hello!"}

@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    method, language, sentence_count, input_type, input_, *rest = request.data
    
    if method == "LSA":
        from sumy.summarizers.lsa import LsaSummarizer as Summarizer
    elif method == "text-rank":
        from sumy.summarizers.text_rank import TextRankSummarizer as Summarizer
    elif method == "lex-rank":
        from sumy.summarizers.lex_rank import LexRankSummarizer as Summarizer
    elif method == "edmundson":
        from sumy.summarizers.edmundson import EdmundsonSummarizer as Summarizer
    elif method == "luhn":
        from sumy.summarizers.luhn import LuhnSummarizer as Summarizer
    elif method == "kl-sum":
        from sumy.summarizers.kl import KLSummarizer as Summarizer
    elif method == "random":
        from sumy.summarizers.random import RandomSummarizer as Summarizer
    elif method == "reduction":
        from sumy.summarizers.reduction import ReductionSummarizer as Summarizer

    if input_type == "URL":
        parser = HtmlParser.from_url(input_, Tokenizer(language))
    elif input_type == "text":
        parser = PlaintextParser.from_string(input_, Tokenizer(language))

    stemmer = Stemmer(language)
    summarizer = Summarizer(stemmer)
    stop_words = get_stop_words(language)

    if method == "edmundson":
        summarizer.null_words = stop_words
        summarizer.bonus_words = parser.significant_words
        summarizer.stigma_words = parser.stigma_words
    else:
        summarizer.stop_words = stop_words

    summary_sentences = summarizer(parser.document, sentence_count)
    summary = " ".join([str(sentence) for sentence in summary_sentences])

    return summary

@app.get("/get_condition")
async def get_condition(condition: Optional[str] = None):
    nhs_api_key = os.getenv("NHS_API_KEY")

    if not nhs_api_key:
        raise HTTPException(status_code=500, detail="NHS_API_KEY is not set")

    if not condition or condition not in app.config.CONDITIONS:
        condition = random.choice(app.config.CONDITIONS)

    url = f"{app.config.NHS_API_BASE_URL}{requests.utils.quote(condition)}"
    headers = {
        "subscription-key": nhs_api_key,
        "Content-Type": app.config.CONTENT_TYPE,
        "User-Agent": app.config.USER_AGENT,
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        extracted_data = extract_urls_and_headlines(response.json())
        random_data = get_random_article(extracted_data)
        return random_data
    else:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")

def extract_urls_and_headlines(api_response):
    result = []

    if "mainEntityOfPage" in api_response and isinstance(api_response["mainEntityOfPage"], list):
        for main_entity in api_response["mainEntityOfPage"]:
            if "mainEntityOfPage" in main_entity and isinstance(main_entity["mainEntityOfPage"], list):
                for web_page_element in main_entity["mainEntityOfPage"]:
                    result.append({
                        "headline": web_page_element.get("headline", ""),
                        "url": web_page_element["url"],
                    })
    return result

def get_random_article(extracted_data):
    if extracted_data:
        random_index = random.randint(0, len(extracted_data) - 1)
        return extracted_data[random_index]
    return {}