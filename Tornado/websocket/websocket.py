from tornado import websocket, web, ioloop
import json
import os

cl = []


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
        #self.write("Hello, world")
        self.render("websocket.html", title="My title", items=[])


class ApiHandler(web.RequestHandler):
    @web.asynchronous
    def get(self, *args):
        self.finish()
        id = self.get_argument("id")
        value = self.get_argument("value")
        data = {"id": id, "value": value}
        data = json.dumps(data)
        for c in cl:
            c.write_message(data)

    @web.asynchronous
    def post(self):
        pass


class StopHandler(web.RequestHandler):
    def get(self, *args):
        ioloop.IOLoop.instance().stop()


app = web.Application([
    (r'/', IndexHandler),
    (r'/ws', SocketHandler),
    (r'/api', ApiHandler),
    (r'/stop', StopHandler),
    (r'/(favicon.ico)', web.StaticFileHandler, {'path': '../'}),
    (r'/(rest_api_example.png)', web.StaticFileHandler, {'path': './'}),
])

if __name__ == "__main__":
    app.listen(8888)
    ioloop.IOLoop.current().start()
