import functools
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
HTTPServer(("127.0.0.1", 4173), handler).serve_forever()
