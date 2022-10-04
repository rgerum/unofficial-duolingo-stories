import os
import requests
import time
from xml.etree import ElementTree
from mutagen.mp3 import MP3
from pathlib import Path
import base64
import re
import sys
import json


class Google(object):
    def __init__(self):

        key_data = {}
        with open(Path(__file__).parent / "rootkey.csv", "r") as fp:
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
        """
        output_data["output_file"] = str(output_file)
                output_data["marks"] = engine.get_speech_marks(speaker, text)
                output_data["marks2"] = marks2
        """
        response_data = {"output_file": str(filename), "engine": "google"}

        headers = {
            'Content-Type': 'application/ssml+xml; charset=utf-8',
            'User-Agent': 'YOUR_RESOURCE_NAME'
        }
        lang, region, voiceName = VoiceId.split("-", 2)

        text = add_marks(text)
        response_data["text"] = text


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
          },
          "enableTimePointing": ["SSML_MARK"]
        }
        """ % (text.replace("\"", "'"), lang, region, lang, region, voiceName)).encode("utf-8"))

        if response.status_code == 200:
            self.filename = filename
            with Path(filename).open('wb') as audio:
                data = json.loads(response.content)
                audio.write(base64.b64decode(data["audioContent"]))
                #print("\nStatus code: " + str(response.status_code) +
                #      "\nYour TTS is ready for playback.\n")
                response_data["marks2"] = data["timepoints"]
                return response_data
        else:
            print(response.content.decode())
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")

    def get_voices_list(self):
        headers = {
            'User-Agent': 'duostories.org'
        }

        response = requests.get("https://texttospeech.googleapis.com/v1/voices?key="+self.subscription_key, headers=headers)

        if response.status_code == 200:
            voices = json.loads(response.content)
            print(voices)
            voice_list = []
            for voice in voices["voices"]:
                voice_list.append([voice["languageCodes"][0], voice["name"], voice["ssmlGender"].upper(), ["NORMAL","NEURAL"]["Wavenet" in voice["name"]], "Google TTS"])
            return voice_list
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")


def add_marks(text):
    import re

    regex_split_token = re.compile(r"(<[^>]+>)|(\w+)|([^\w<>]*)")

    def splitTextTokens(text, keep_tilde=True):
        return regex_split_token.findall(text)

    regex_combine_whitespace = re.compile(r" +")

    text = regex_combine_whitespace.sub(" ", text).strip()
    text2 = ""
    i = 0
    for tag, text, space in splitTextTokens(text):
        if tag != "":
            text2 += tag
        elif text != "":
            i += len(text)
            text2 += text+f'<mark name="{i}"/>'
        elif space != "":
            i += len(space)
            text2 += space#+f'<mark name="{i}"/>'

    return text2

if __name__ == "__main__":
    app = Google()
    #app.get_token()
    text = '<speak>Marian was zo moe   dat  ze  <prosody volume="silent">zout in haar koffie deed in plaats van suiker</prosody>.</speak>'
    #text2 = add_marks(text)
    #print(text2)
    app.save_audio("test.mp3", "da-DK-Standard-E", text)
    app.save_audio("test.mp3", "da-DK-Standard-E", '<speak>Hallo<mark name="timepoint_0"/>, ik</speak>')
    # Get a list of voices https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#get-a-list-of-voices
    #app.get_voices_list()
