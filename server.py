import json
import os
import base64
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def load_env_file(path: str = '.env'):
    try:
        if not os.path.exists(path):
            return
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                os.environ[k] = v
    except Exception:
        pass

class Handler(BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            return
        self.send_response(404)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        if self.path != '/api/transactions':
            self.send_response(404)
            self._set_cors()
            self.end_headers()
            return
        load_env_file()
        ln = int(self.headers.get('Content-Length', '0') or '0')
        raw = self.rfile.read(ln) if ln > 0 else b''
        try:
            payload = json.loads(raw or b'{}')
        except Exception:
            self.send_response(400)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":"invalid_json"}')
            return
        pk = os.environ.get('CYBERHUB_PUBLIC_KEY', '')
        sk = os.environ.get('CYBERHUB_PRIVATE_KEY', '')

        code = None
        try:
            items = payload.get('items') or []
            if items:
                code = (items[0].get('externalRef') or '').lower()
        except Exception:
            code = None
        amt = 0
        try:
            amt = int(payload.get('amount') or 0)
        except Exception:
            amt = 0
        if amt <= 0:
            if code in ('correios','sedex'):
                payload['amount'] = 3799
                if payload.get('items'):
                    payload['items'][0]['unitPrice'] = 3799
                    payload['items'][0]['title'] = 'Frete Correios'
            elif code == 'jadlog':
                payload['amount'] = 3499
                if payload.get('items'):
                    payload['items'][0]['unitPrice'] = 3499
                    payload['items'][0]['title'] = 'Frete Jadlog'
        creds = base64.b64encode(f"{pk}:{sk}".encode()).decode()
        headers = {
            'accept': 'application/json',
            'authorization': f'Basic {creds}',
            'content-type': 'application/json',
        }
        data = json.dumps(payload).encode()
        req = Request('https://api.cyberhubpagamentos.com/v1/transactions', data=data, headers=headers, method='POST')
        try:
            with urlopen(req, timeout=25) as resp:
                body = resp.read()
                self.send_response(resp.status)
                self._set_cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(body)
        except HTTPError as e:
            b = e.read() if hasattr(e, 'read') else b''
            self.send_response(e.code or 500)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b or json.dumps({"message":"Não autorizado."}).encode())
        except URLError:
            self.send_response(502)
            self._set_cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":"network_unavailable"}')

def run():
    port = int(os.environ.get('PORT', '8080'))
    server = HTTPServer(('0.0.0.0', port), Handler)
    server.serve_forever()

if __name__ == '__main__':
    run()