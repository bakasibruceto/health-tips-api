class Config:
    DEBUG = True  # Set to False in production
    NHS_API_BASE_URL = "https://api.nhs.uk/live-well/"
    USER_AGENT = "Mozilla/5.0"
    CONTENT_TYPE = "application/json"
    CONDITIONS = ["alcohol-advice", "sexual-health"]
    
