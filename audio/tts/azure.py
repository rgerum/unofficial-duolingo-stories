import os
import requests
import time
from xml.etree import ElementTree
from mutagen.mp3 import MP3
from pathlib import Path
import re
import json


class Azure(object):
    def __init__(self):

        key_data = {}
        with open("rootkey.csv", "r") as fp:
            for line in fp:
                key, value = line.strip().split("=")
                key_data[key] = value

        self.subscription_key = key_data["AzureKey"]
        self.access_token = None
        
    def get_token(self):
        fetch_token_url = "https://westeurope.api.cognitive.microsoft.com/sts/v1.0/issueToken"
        headers = {
            'Ocp-Apim-Subscription-Key': self.subscription_key,
        }
        response = requests.post(fetch_token_url, headers=headers)
        self.access_token = str(response.text)
        #print("self.access_token", self.access_token)
        
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
        print("save_audio")
        self.get_token()
        base_url = 'https://westeurope.tts.speech.microsoft.com/'
        path = 'cognitiveservices/v1'
        constructed_url = base_url + path
        headers = {
            'Authorization': 'Bearer ' + self.access_token,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'duostories.org'
        }
        if text.startswith("<speak>"):
            text = text[len("<speak>"):]
        if text.endswith("</speak>"):
            text = text[:-len("</speak>")]

        #print("text")
        import sys
        #print(text.encode(sys.stdout.encoding, errors='replace'))
        
        lang, region, voiceName = VoiceId.split("-", 2)
        body = f"""
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="{lang}-{region}">
    <voice name="Microsoft Server Speech Text to Speech Voice ({lang}-{region}, {voiceName})">
    {text}
    </voice>
</speak>
"""
        #print("body", body.encode(sys.stdout.encoding, errors='replace'))

        xml_body = ElementTree.Element('speak', version='1.0')
        xml_body.set('{http://www.w3.org/XML/1998/namespace}lang', 'en-us')
        voice = ElementTree.SubElement(xml_body, 'voice')
        voice.set('{http://www.w3.org/XML/1998/namespace}lang', 'en-US')
        voice.set(
            'name', f'Microsoft Server Speech Text to Speech Voice ({lang}-{region}, {voiceName})')
        voice.text = text
        #print(ElementTree.tostring(xml_body))
        #body = ElementTree.tostring(xml_body)
        #print(body.encode(sys.stdout.encoding, errors='replace'))

        response = requests.post(constructed_url, headers=headers, data=body.encode('utf-8'))
        if response.status_code == 200:
            self.filename = filename
            with Path(filename).open('wb') as audio:
                audio.write(response.content)
                #print("\nStatus code: " + str(response.status_code) +
                #      "\nYour TTS is ready for playback.\n")
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")

    def get_voices_list(self):
        print("get_voices_list")
        self.get_token()
        base_url = 'https://westeurope.tts.speech.microsoft.com/'
        path = 'cognitiveservices/voices/list'

        constructed_url = base_url + path
        headers = {
            'Authorization': 'Bearer ' + self.access_token,
        }

        import sys
        response = requests.get(constructed_url, headers=headers)
        if response.status_code == 200:
            voices = json.loads(response.content)
            voice_list = []
            for voice in voices:
                if voice["Status"] != "Deprecated":
                    voice_list.append([voice["Locale"], voice["ShortName"], voice["Gender"].upper(),voice["VoiceType"].upper(), "Microsoft Azure"])
            return voice_list
                #print(voice)
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")

if __name__ == "__main__":
    app = Azure()
    app.get_token()
    #app.save_audio("test.mp3", 'en-US-JennyNeural', 'This is a test.')
    # Get a list of voices https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#get-a-list-of-voices
    app.get_voices_list()
