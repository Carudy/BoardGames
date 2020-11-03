from http.server import BaseHTTPRequestHandler, HTTPServer, SimpleHTTPRequestHandler
import json, ssl, threading

class Base_handler(SimpleHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        # self.send_header('Content-type', 'text/plain')
        self.end_headers()

    def log_message(self, format, *args):
        return

    # def do_GET(self):
    #     self._set_response()
    #     self.wfile.write("This is dy\'s game server.\n GET request for {}".format(self.path).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = json.loads(self.rfile.read(content_length))

        res = self.run(post_data)

        self._set_response()
        self.wfile.write(json.dumps(res).encode('utf-8'))

    def run(self, data):
        print(data)
        return {"x" : 5}


class Game_server():
    def __init__(self, handler_class, port=8080):
        print('Starting..')
        server_address = ('', port)
        httpd = HTTPServer(server_address, handler_class)
        try:
            print('Started.')
            # httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server.pem', server_side=True)
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        httpd.server_close()

class Server_thread(threading.Thread):
    def __init__(self, S, port):
        self.S, self.port = S, port
        threading.Thread.__init__(self)

    def run(self):
        Game_server(self.S, self.port)