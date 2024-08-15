import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# ---------Start copy from here---------
import json
import random
from datetime import datetime, timezone
from typing import List, Optional
import nltk
import requests
from pydantic import BaseModel
from sumy.nlp.stemmers import Stemmer
from sumy.summarizers.lex_rank import LexRankSummarizer as Summarizer
from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.html import HtmlParser
# ---------End copy here----------

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------Start copy from here---------
# Modify the code if needed
@app.on_event("startup")
async def download_nltk_resources():
    nltk.download("punkt")

class SummarizeRequest(BaseModel):
    data: List[Optional[str]]

@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    language = "english"
    sentence_count, input_, *rest = request.data
    parser = HtmlParser.from_url(input_, Tokenizer(language))
    stemmer = Stemmer(language)
    summarizer = Summarizer(stemmer)
    summary_sentences = summarizer(parser.document, sentence_count)
    summary = " ".join([str(sentence) for sentence in summary_sentences])
    
    return summary

@app.get("/health_tips")
async def health_tips(param: str):
    data = await get_list_and_random(param)
    id = data.get("RandomId")
    result = await get_data(id)

    summary_request = SummarizeRequest(
        data=["2", result["link"]]
    )
    summary = await summarize(summary_request)

    result["content"] = summary
    
    # Debug
    print(json.dumps(result, indent=5))
    return result

async def get_data(topic_id: int):
    url = f"https://health.gov/myhealthfinder/api/v3/topicsearch.json?TopicId={topic_id}&Lang=en"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Navigate through the keys: Result -> Resources -> Resource 
        result = data.get("Result", {})
        resources = result.get("Resources", {})
        resource = (
            resources.get("Resource", {})[0]
            if isinstance(resources.get("Resource"), list) and resources.get("Resource")
            else None
        )
        
        if resource:
            title = resource.get("Title")
            lastUpdated = resource.get("LastUpdate")
            link = resource.get("AccessibleVersion")
            lastUpdatedInt = int(lastUpdated)
            lastUpdatedDate = datetime.fromtimestamp(lastUpdatedInt, timezone.utc)
            lastUpdatedFormatted = lastUpdatedDate.strftime("%B %d, %Y")
           
        else:
            return {"error": "No resource found"}       

        data = {
            "LastUpdated": lastUpdatedFormatted,
            "title": title,
            "link": link,
        }
        # Debug
        # print(json.dumps(data, indent=5))
        return data
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
    # Debug
    # print(json.dumps(data, indent=4))
    return data

# ---------End copy here----------

async def main():
  await health_tips(109) 
        
if __name__ == "__main__":
    asyncio.run(main())
