
from tornado import websocket, web, ioloop, httpserver
from abc import ABCMeta, abstractmethod
import json
import os
import wave
import time
import ssl
#import audio_ds

cl = []

wavFile = open('test.wav', 'wb')
setting = dict(
    template_path=os.path.join(os.path.dirname(__file__), "template"),
    static_path=os.path.join(os.path.dirname(__file__), "static"),
)


class AudioRecorder(metaclass=ABCMeta):
    @abstractmethod
    def start_record(self):
        pass

    @abstractmethod
    def write(self, message):
        pass

    @abstractmethod
    def end_record(self):
        pass


class RawFileRecorder(AudioRecorder):
    def __init__(self):
        self.wav_file = open('test.wav', 'wb')
        pass

    def start_record(self):
        print("begin start recording")
        if self.wav_file:
            self.wav_file.close()
        self.wav_file = open('test.wav', 'wb')

    def write(self, message):
        self.wav_file.write(message)

    def end_record(self):
        print("end recording")
        if self.wav_file:
            self.wav_file.close()


class WavFileRecorder(AudioRecorder):
    def __init__(self):
        self.wav_file = wave.open('test.wav', 'wb')
        self.wav_file.setnchannels(1)  # 声道
        self.wav_file.setsampwidth(2)  # 采样字节 1 or 2
        self.wav_file.setframerate(16000)  # 采样频率 8000 or 16000
        pass

    def start_record(self):
        print("begin start recording")
        if not (self.wav_file is None):
            self.wav_file.close()
        self.wav_file = wave.open('test.wav', 'wb')
        self.wav_file.setnchannels(1)  # 声道
        self.wav_file.setsampwidth(2)  # 采样字节 1 or 2
        self.wav_file.setframerate(8000)  # 采样频率 8000 or 16000

    def write(self, message):
        self.wav_file.writeframes(message)

    def end_record(self):
        print("end recording")
        if self.wav_file:
            self.wav_file.close()


class SocketHandler(websocket.WebSocketHandler):
    def __init__(self, application, request, **kwargs):
        super(SocketHandler, self).__init__(application, request, **kwargs)
        self.audio_handler = WavFileRecorder()
        pass

    def check_origin(self, origin):
        return True

    def open(self, sid):
        print("WebSocket opened")
        self.write_message(u"your sid {0}".format(sid))
        if self not in cl:
            cl.append(self)

    def on_message(self, message):
        print(type(message))

        if isinstance(message, str):
            self.write_message(u"You said: " + message)
            message = message.replace("'", '"')
            data = json.loads(message)
            action = data['action']
            if action == 'start':
                self.audio_handler.start_record()
            elif action == 'end':
                self.audio_handler.end_record()
                timestamp = time.time()
                #result = audio_ds.inference('test.wav')
                result=''
                self.write_message('result: [' + str(time.time() - timestamp) + ']' + result)
        elif isinstance(message, bytes):
            self.audio_handler.write(message)
        else:
            print(u'data wrong: ' + message)

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
    (r'/ws/(.*)', SocketHandler),
    (r'/stop', StopHandler),
], **setting, debug=True)

if __name__ == "__main__":
    http_server = httpserver.HTTPServer(app, ssl_options={
        "certfile": os.path.join(os.path.dirname(os.path.realpath(__file__)), "ssh/CyberObject.csr"),
        "keyfile": os.path.join(os.path.dirname(os.path.realpath(__file__)), "ssh/CyberObject.key"),
    })
    http_server.listen(4443)

    print("App start...")
    ioloop.IOLoop.instance().start()

    # app.listen(8888)
    # ioloop.IOLoop.current().start()
