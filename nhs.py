# @app.get("/get_condition")
# async def get_condition(condition: Optional[str] = None):
#     nhs_api_key = os.getenv("NHS_API_KEY")

#     if not nhs_api_key:
#         raise HTTPException(status_code=500, detail="NHS_API_KEY is not set")

#     if not condition or condition not in app.config.CONDITIONS:
#         condition = random.choice(app.config.CONDITIONS)

#     url = f"{app.config.NHS_API_BASE_URL}{requests.utils.quote(condition)}"
#     headers = {
#         "subscription-key": nhs_api_key,
#         "Content-Type": app.config.CONTENT_TYPE,
#         "User-Agent": app.config.USER_AGENT,
#     }

#     response = requests.get(url, headers=headers)

#     if response.status_code == 200:
#         extracted_data = extract_urls_and_headlines(response.json())
#         random_data = get_random_article(extracted_data)
#         return random_data
#     else:
#         raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")

# def extract_urls_and_headlines(api_response):
#     result = []

#     if "mainEntityOfPage" in api_response and isinstance(api_response["mainEntityOfPage"], list):
#         for main_entity in api_response["mainEntityOfPage"]:
#             if "mainEntityOfPage" in main_entity and isinstance(main_entity["mainEntityOfPage"], list):
#                 for web_page_element in main_entity["mainEntityOfPage"]:
#                     result.append({
#                         "headline": web_page_element.get("headline", ""),
#                         "url": web_page_element["url"],
#                     })
#     return result

# def get_random_article(extracted_data):