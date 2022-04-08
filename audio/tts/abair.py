import os
import requests
import time
from xml.etree import ElementTree
from mutagen.mp3 import MP3
from pathlib import Path
import re
import json
from xml.etree import ElementTree
os.environ["PATH"] = "/home/carex/.local/bin:/home/carex/bin:/opt/uberspace/etc/carex/binpaths/ruby:/opt/rh/devtoolset-9/root/usr/bin:/home/carex/.cargo/bin:/home/carex/.luarocks/bin:/home/carex/go/bin:/home/carex/.deno/bin:/home/carex/.config/composer/vendor/bin:/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin:/home/carex/.dotnet/tools"
from pydub import AudioSegment
import io


class Abair(object):
    def __init__(self):
        pass
        
    def get_speech_marks(self, VoiceId, text):
        duration = MP3(self.filename).info.length * 1000
        length = len(text)
        start = 0
        marks = []
        text = re.sub(r"<[^>]*>", "", text)
        for index, part in enumerate(
                re.split(r"([\s\u2000-\u206F\u2E00-\u2E7F\\¡!\"#$%&*,.\/:;<=>¿?@^_`{|}~]+)", text)):
            if index % 2 == 0 and len(part):
                marks.append(dict(
                    time=start / length * duration,
                    type="word",
                    start=start,
                    end=start + len(part),
                    value=part,
                ))
            start += len(part)
        return marks

    @staticmethod
    def checkVoiceId(VoiceId):
        if VoiceId in [
            "ga_UL_Gweedore",
            "ga_CO_Connemara",
            "ga_MU_Dingle",
        ]:
            return True
        return False
        
    def save_audio(self, filename, VoiceId, text):
        # remove ssml
        text = re.sub(r"<[^>]*>", "", text)

        if VoiceId == "ga_UL_Gweedore":
            payload = {
                'dialect': 'ga_UL',
                'inputText': text,
                'synth-mode': 'dnn',
                'speed': 1,
                'pitch': 1,
                'speaker': 'female',
            }
        elif VoiceId == "ga_CO_Connemara":
            payload = {
                'dialect': 'ga_CO',
                'inputText': text,
                'synth-mode': 'dnn',
                'speed': 1,
                'pitch': 1,
                'speaker': 'male',
            }
        elif VoiceId == "ga_MU_Dingle":
            payload = {
                'dialect': 'ga_MU',
                'inputText': text,
                'synth-mode': 'dnn',
                'speed': 1,
                'pitch': 1,
                'speaker': 'male',
            }
        else:
            return "invalid voice"

        response = requests.post("https://www.abair.tcd.ie/action/synthesize",
                                 headers={
                                     #    'Content-Type': 'application/xml; charset=utf-8',
                                     # 'User-Agent': 'unofficial_duolingo_stories',
                                     'Host': 'www.abair.tcd.ie',
                                     'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0',
                                     'Accept': '*/*',
                                     'Accept-Language': 'en-US,en;q=0.5',
                                     'Accept-Encoding': 'gzip, deflate, br',
                                     # 'Content-Type': 'multipart/form-data; boundary=---------------------------384317411539569462283025226814',
                                     # 'Content-Length': 813,
                                     'Origin': 'https://www.abair.tcd.ie',
                                     'Connection': 'keep-alive',
                                     'Referer': 'https://www.abair.tcd.ie/en/',
                                     'Cookie': 'privacy=accepted; synthInput=%20T%C3%A1%20Sin%C3%A9ad%20sa~bhaile%2C%20lena%20dearth%C3%A1ir%2C%20St%C3%ADof%C3%A1n.',
                                     'Pragma': 'no-cache',
                                     'Cache-Control': 'no-cache',
                                 },
                                 data=payload,
                                 )

        if response.status_code == 200:
            self.filename = filename

            tree = ElementTree.fromstring(response.content)
            #print(response)

            wav = None
            for sentence in tree.findall("sentence"):
                response2 = requests.get("https://www.abair.tcd.ie/audio/" + sentence.attrib["soundfilename"] + ".mp3")
                file = io.BytesIO(response2.content)
                if wav is None:
                    wav = AudioSegment.from_mp3(file)
                else:
                    wav += AudioSegment.from_mp3(file)

            wav.export(filename, format="mp3")
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong.\n")

    def get_voices_list(self):
        return [
            ["ga-UL", "ga_UL_Gweedore", "FEMALE", "NEURAL","Abair"],
            ["ga-CO", "ga_CO_Connemara", "MALE", "NEURAL","Abair"],
            ["ga-MU", "ga_MU_Dingle", "FEMALE", "NEURAL","Abair"],
        ]

if __name__ == "__main__":
    engine = Abair()
    engine.save_audio("test.mp3", "ga_CO_Connemara", "Tá Sinéad sa bhaile. lena deartháir, Stíofán.")
if 0:
    response = requests.post("https://www.abair.tcd.ie/action/synthesize",
        headers={
        #    'Content-Type': 'application/xml; charset=utf-8',
            #'User-Agent': 'unofficial_duolingo_stories',
            'Host': 'www.abair.tcd.ie',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            #'Content-Type': 'multipart/form-data; boundary=---------------------------384317411539569462283025226814',
            #'Content-Length': 813,
            'Origin': 'https://www.abair.tcd.ie',
            'Connection': 'keep-alive',
            'Referer': 'https://www.abair.tcd.ie/en/',
            'Cookie': 'privacy=accepted; synthInput=%20T%C3%A1%20Sin%C3%A9ad%20sa~bhaile%2C%20lena%20dearth%C3%A1ir%2C%20St%C3%ADof%C3%A1n.',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        },
        data={
            'dialect': 'ga_CO',
            'inputText': 'Tá Sinéad sa bhaile, lena deartháir, Stíofán.',
            'synth-mode': 'dnn',
            'speed': 1,
            'pitch': 1,
            'speaker': 'male',
        }
    )
    from xml.etree import ElementTree

    response = requests.get(url)

    tree = ElementTree.fromstring(response.content)
    print(response)

    response2 = requests.get("https://www.abair.tcd.ie/audio/"+tree.find("sentence").attrib["soundfilename"]+".mp3")
    filename = "test.mp3"
    with Path(filename).open('wb') as audio:
        audio.write(response2.content)

    duration = MP3(filename).info.length * 1000