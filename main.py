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


@app.get("/get_data")
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
        title = resource.get("Title")
        sections = resource.get("Sections", [])
        lastUpdated = resource.get("LastUpdate")
        link = resource.get("AccessibleVersion")

        data = {
            "LastUpdated": lastUpdated,
            "title": title,
            "Link": link,
            "Sections": sections,
        }
        print(json.dumps(data, indent=5))
        # return sections
    else:
        print({"error": "Failed to fetch data from the health.gov API"})


@app.get("/get_list")
async def get_list(id: str = Query(None, description="Filter resources by Id")):
    url = "https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=en&categoryId=15"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Navigate through the keys: Result -> Resources -> Resource
        result = data.get("Result", {})
        resources = result.get("Resources", {})
        resource_list = resources.get("Resource", [])

        # Extract all Ids from the resource list
        ids = [resource.get("Id") for resource in resource_list if "Id" in resource]

        # Filter resources by the provided Id if it exists
        if id:
            resource_list = [
                resource for resource in resource_list if resource.get("Id") == id
            ]

        # Create a dictionary with the Ids and their total count
        data = {"Ids": ids, "TotalIds": len(ids), "FilteredResources": resource_list}
        print(json.dumps(data, indent=4))
        return data
    else:
        print(
            json.dumps(
                {"error": "Failed to fetch data from the health.gov API"}, indent=4
            )
        )
        return {"error": "Failed to fetch data from the health.gov API"}


@app.get("/rand_list")
async def rand_list(
    topic_id: int = Query(..., description="Topic ID to filter resources"),
    count: int = Query(1, description="Number of random IDs to return"),
):
    url = f"https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=en&categoryId={topic_id}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Navigate through the keys: Result -> Resources -> Resource
        result = data.get("Result", {})
        resources = result.get("Resources", {})
        resource_list = resources.get("Resource", [])

        # Extract all Ids from the resource list
        ids = [resource.get("Id") for resource in resource_list if "Id" in resource]

        # Ensure at least one ID is returned
        if not ids:
            return {"error": "No IDs found in the resource list"}

        # Select one random ID
        random_id = random.choice(ids)

        # Create a dictionary with the random Id and its total count
        data = {"RandomId": random_id, "TotalRandomIds": 1}
        # print(json.dumps(data, indent=4))
        return data
    else:
        print(
            json.dumps(
                {"error": "Failed to fetch data from the health.gov API"}, indent=4
            )
        )
        return {"error": "Failed to fetch data from the health.gov API"}


async def main():
    await get_list("15")
    # data = await get_condition()
    # first_section = data['section'][0]  # Access the first item in the list
    # # print(first_section)
    # # To use the values, you can directly access them as shown below
    # title = first_section['Title']
    # description = first_section['Description']
    # content = first_section['Content']
    # print(f"Title: {title}, Description: {description}, Content: {content}")


if __name__ == "__main__":
    asyncio.run(main())
