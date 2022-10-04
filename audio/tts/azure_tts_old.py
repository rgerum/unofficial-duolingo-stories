from pathlib import Path
import requests
import json

class Azure(object):
    def __init__(self):

        key_data = {}
        with open(Path(__file__).parent / "rootkey.csv", "r") as fp:
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
            print(response.content)
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")
