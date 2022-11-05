#!/usr/bin/env python3
import boto3
import json
import sys
from pathlib import Path

from transliterate import get_translit_function

from gtts import gTTS
from mutagen.mp3 import MP3

def responseToDict(resp):
        return [json.loads(x) for x in resp.split("\n") if x != ""]

class AmazonPolly:

    def __init__(self):

        key_data = {}
        with open(Path(__file__).parent / "rootkey.csv", "r") as fp:
            for line in fp:
                key, value = line.strip().split("=")
                key_data[key] = value


        self.polly_client = boto3.Session(
            aws_access_key_id=key_data["AWSAccessKeyId"],
            aws_secret_access_key=key_data["AWSSecretKey"],
            region_name='eu-central-1').client('polly')


    def get_speech_marks(self, VoiceId, Text):
        response = self.polly_client.synthesize_speech(VoiceId=VoiceId,
                                                  OutputFormat='json',
                                                  SpeechMarkTypes=["word"],
                                                  Text=Text,
                                                  TextType="ssml")
        #print(response)
        text = response["AudioStream"].read().decode()
        return responseToDict(text)

    def save_audio(self, filename, VoiceId, Text):
        response = self.polly_client.synthesize_speech(VoiceId=VoiceId,
                                                      OutputFormat='mp3',
                                                      Text=Text,
                                                      TextType="ssml")
        #print(response)
        with Path(filename).open('wb') as fp:
            fp.write(response['AudioStream'].read())

    def get_voices_list(self):
        response = self.polly_client.describe_voices()["Voices"]
        voices = []
        for r in response:
            voices.append([r["LanguageCode"], r["Id"], r["Gender"].upper(), ["NORMAL", "NEURAL"]["neural" in  r["SupportedEngines"]], "Amazon Polly"])
        return voices


if __name__ == "__main__":
    app = AmazonPolly()
    print(app.get_voices_list())
    text = '<speak>Marian was zo moe   dat  ze  <prosody volume="silent">zout in haar koffie deed in plaats van suiker</prosody>.</speak>'
    app.save_audio("test.mp3", "Mads", text)
    print(app.get_speech_marks("Mads", text))


