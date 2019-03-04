import os
import wave
from pyaudio import PyAudio, paInt16


def readWavFile(file='test.wav'):
    fp = wave.open(file, 'rb')

    print('getnframes:', fp.getnframes())
    print('sampwidth:', fp.getsampwidth())
    print('framerate:', fp.getframerate())
    print('channels:', fp.getnchannels())

    nf = fp.getnframes()  # 获取文件的采样点数量
    f_len = nf * 2  # 文件长度计算，每个采样2个字节
    audio_data = fp.readframes(nf)


def play():
    chunk = 2014
    wf = wave.open(r"01.wav", 'rb')
    p = PyAudio()
    stream = p.open(format=p.get_format_from_width(wf.getsampwidth()), channels=wf.getnchannels(),
                    rate=wf.getframerate(), output=True)
    while True:
        data = wf.readframes(chunk)
        if data == "":
            break
        stream.write(data)
    stream.close()
    p.terminate()


def on_message(self, message):
    print('')


if __name__ == "__main__":
    print('ddd')
