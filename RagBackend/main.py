"""
Main Uvicorn application entry point.
"""

import app.serverless_compat
from app.api.router import create_app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
