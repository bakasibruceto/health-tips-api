from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
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
import asyncio
import json
from datetime import datetime, timezone
from bs4 import BeautifulSoup

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


async def main():
    await get_data()


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

async def get_data(topic_id: int):
    url = f"https://health.gov/myhealthfinder/api/v3/topicsearch.json?TopicId={topic_id}&Lang=en"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Navigate through the keys: Result -> Resources -> Resource -> Sections -> section
        result = data.get("Result", {})
        resources = result.get("Resources", {})
        resource = (
            resources.get("Resource", {})[0]
            if isinstance(resources.get("Resource"), list) and resources.get("Resource")
            else None
        )
        if resource:
            sections = resource.get("Sections", {}).get("section", {})
            if sections:
                first_section = sections[0]
                content = first_section.get('Content', 'No Content')
                title = resource.get("Title")
                lastUpdated = resource.get("LastUpdate")
                link = resource.get("AccessibleVersion")
                lastUpdatedInt = int(lastUpdated)
                lastUpdatedDate = datetime.fromtimestamp(lastUpdatedInt, timezone.utc)
                lastUpdatedFormatted = lastUpdatedDate.strftime("%B %d, %Y")
                soup = BeautifulSoup(content, "html.parser")
                clean_content = soup.get_text()
            else:
                return {"error": "Sections list is empty"}
        else:
            return {"error": "No resource found"}       

        data = {
            "LastUpdated": lastUpdatedFormatted,
            "title": title,
            "link": link,
            "content": clean_content
        }
        print(json.dumps(data, indent=5))
        # return sections
    else:
        print({"error": "Failed to fetch data from the health.gov API"})

async def get_list_and_random(
    topic_id: int = Query(..., description="Topic ID to filter resources"),
    id: str = Query(None, description="Filter resources by Id"),
):
    url = f"https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=en&categoryId={topic_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

    data = response.json()
    result = data.get("Result", {})
    resources = result.get("Resources", {})
    resource_list = resources.get("Resource", [])

    ids = [resource.get("Id") for resource in resource_list if "Id" in resource]

    if not ids:
        raise HTTPException(status_code=404, detail="No IDs found in the resource list")

    random_id = random.choice(ids)

    data = {
        "Ids": ids,
        "TotalIds": len(ids),
        "RandomId": random_id,
    }
    
    print(json.dumps(data, indent=4))
    return data

@app.get("/health_tips")
async def health_tips(param: str):
    data = await get_list_and_random(param)
    id = data.get("RandomId")
    result = await get_data(id)
    return result

async def main():
  await health_tips(25) 
        
if __name__ == "__main__":
    asyncio.run(main())
