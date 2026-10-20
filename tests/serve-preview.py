"""Local QA server: retain HTTP errors without flooding CI with asset requests."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class PreviewHandler(SimpleHTTPRequestHandler):
    def log_request(self, code="-", size="-"):
        if not isinstance(code, int) or code >= 400:
            super().log_request(code, size)


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", 4173), PreviewHandler) as server:
        server.serve_forever()
