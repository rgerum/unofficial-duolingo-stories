import os
import requests
import time
from xml.etree import ElementTree
from mutagen.mp3 import MP3
from pathlib import Path
import re
import json


class Google(object):
    def __init__(self):

        key_data = {}
        with open("rootkey.csv", "r") as fp:
            for line in fp:
                key, value = line.strip().split("=")
                key_data[key] = value

        self.subscription_key = key_data["GoogleKey"]
        self.access_token = None
        
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
        
    def save_audio(self, filename, VoiceId, text):

        base_url = 'https://westeurope.tts.speech.microsoft.com/'
        path = 'cognitiveservices/v1'
        constructed_url = base_url + path
        headers = {
            'Content-Type': 'application/ssml+xml; charset=utf-8',
            'User-Agent': 'YOUR_RESOURCE_NAME'
        }
        #if text.startswith("<speak>"):
        #    text = text[len("<speak>"):]
        #if text.endswith("</speak>"):
        #    text = text[:-len("</speak>")]

        #print("text")
        import sys
        #print(text.encode(sys.stdout.encoding, errors='replace'))
        
        lang, region, voiceName = VoiceId.split("-", 2)

        response = requests.post("https://texttospeech.googleapis.com/v1beta1/text:synthesize?key="+self.subscription_key,
        headers=headers,
        data=("""
        {
          "audioConfig": {
            "audioEncoding": "MP3"
          },
          "input": {
            "ssml": "%s"
          },
          "voice": {
            "languageCode": "%s-%s",
            "name": "%s-%s-%s"
          }
        }
        """ % (text, lang, region, lang, region, voiceName)).encode("utf-8"))
        if response.status_code == 200:
            self.filename = filename
            print(json.loads(response.content))
            print(json.loads(response.content)["audioContent"])
            import base64
            with Path(filename).open('wb') as audio:
                audio.write(base64.b64decode(json.loads(response.content)["audioContent"]))
                print("\nStatus code: " + str(response.status_code) +
                      "\nYour TTS is ready for playback.\n")
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")


if __name__ == "__main__":
    app = Google()
    #app.get_token()
    app.save_audio("test.mp3", "da-DK-Standard-E", "<speak>Андрій вдома зі своєю дружиною Софією.</speak>")
    # Get a list of voices https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#get-a-list-of-voices
    # app.get_voices_list()
