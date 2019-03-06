from tornado import websocket, web, ioloop
import json
import os

cl = []

setting = dict(
    template_path=os.path.join(os.path.dirname(__file__), "template"),
    static_path=os.path.join(os.path.dirname(__file__), "static"),
)


class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        print("WebSocket opened")
        if self not in cl:
            cl.append(self)

    def on_message(self, message):
        if (isinstance(message, str)):
            self.write_message(u"You said: " + message)
        else:
            with open('test.wav', 'wb') as file:
                file.write(message)

    def on_close(self):
        print("WebSocket closed")
        if self in cl:
            cl.remove(self)


class IndexHandler(web.RequestHandler):
    def get(self):
        # self.write("Hello, world")
        self.render("audio_ws.html", title="My title", items=[])


class StopHandler(web.RequestHandler):
    def get(self, *args):
        ioloop.IOLoop.instance().stop()


app = web.Application([
    (r'/', IndexHandler),
    (r'/ws', SocketHandler),
    (r'/stop', StopHandler),
    (r'/(favicon.ico)', web.StaticFileHandler, {'path': '../'}),
    (r'/(rest_api_example.png)', web.StaticFileHandler, {'path': './'}),
], **setting, debug=True)

if __name__ == "__main__":
    app.listen(8888)
    ioloop.IOLoop.current().start()
