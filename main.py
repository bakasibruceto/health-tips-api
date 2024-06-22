from flask import Flask, jsonify, request
from flask_cors import CORS
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

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load configuration
from config import Config
app.config.from_object(Config)

# Ensure NLTK resources are downloaded
nltk.download("punkt")


@app.get("/")
def index():
    return "<h1>Hello!</h1>"

@app.post("/summarize")
def summarize():
    method, language, sentence_count, input_type, input_, *rest = (
        request.get_json().get("data", "")
    )
    if method == "LSA":
        from sumy.summarizers.lsa import LsaSummarizer as Summarizer
    if method == "text-rank":
        from sumy.summarizers.text_rank import TextRankSummarizer as Summarizer
    if method == "lex-rank":
        from sumy.summarizers.lex_rank import LexRankSummarizer as Summarizer
    if method == "edmundson":
        from sumy.summarizers.edmundson import EdmundsonSummarizer as Summarizer
    if method == "luhn":
        from sumy.summarizers.luhn import LuhnSummarizer as Summarizer
    if method == "kl-sum":
        from sumy.summarizers.kl import KLSummarizer as Summarizer
    if method == "random":
        from sumy.summarizers.random import RandomSummarizer as Summarizer
    if method == "reduction":
        from sumy.summarizers.reduction import ReductionSummarizer as Summarizer

    if input_type == "URL":
        parser = HtmlParser.from_url(input_, Tokenizer(language))
    if input_type == "text":
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

@app.route("/get_condition")
def get_condition():
    condition = request.args.get("condition")  # Default condition
    nhs_api_key = os.getenv("NHS_API_KEY")

    if not nhs_api_key:
        return jsonify({"error": "NHS_API_KEY is not set"}), 500

    #If a specific condition is not requested, choose one randomly from the list
    if not condition or condition not in app.config["CONDITIONS"]:
        condition = random.choice(app.config["CONDITIONS"])

    url = f"{app.config['NHS_API_BASE_URL']}{requests.utils.quote(condition)}"
    headers = {
        "subscription-key": nhs_api_key,
        "Content-Type": app.config["CONTENT_TYPE"],
        "User-Agent": app.config["USER_AGENT"],
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        extracted_data = extract_urls_and_headlines(response.json())
        random_data = get_random_article(extracted_data)
        return jsonify(random_data)
    else:
        return jsonify(
            {"error": "Failed to fetch data", "status_code": response.status_code}
        )

def extract_urls_and_headlines(api_response):
    result = []

    if "mainEntityOfPage" in api_response and isinstance(
        api_response["mainEntityOfPage"], list
    ):
        for main_entity in api_response["mainEntityOfPage"]:
            if "mainEntityOfPage" in main_entity and isinstance(
                main_entity["mainEntityOfPage"], list
            ):
                for web_page_element in main_entity["mainEntityOfPage"]:
                    result.append(
                        {
                            "headline": web_page_element.get("headline", ""),
                            "url": web_page_element["url"],
                        }
                    )
    return result

def get_random_article(extracted_data):
    random_index = random.randint(0, len(extracted_data) - 1)
    return extracted_data[random_index]

def create_app():
    return app
  
if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])