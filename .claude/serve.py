import functools
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Absolute project root (avoid getcwd — blocked in the preview sandbox)
ROOT = "/Users/avihugurzad/Desktop/work - graphics/עדן - אתר"
PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else "4173"))

handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
HTTPServer(("127.0.0.1", PORT), handler).serve_forever()
