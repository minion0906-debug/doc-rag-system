import sys
from pathlib import Path

# Add project root directory to Python path so 'app' module is discovered by Vercel serverless runtime
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
# Apply serverless threading patch immediately before loading any libraries
import app.serverless_compat

from app.api.router import create_app

app = create_app()
