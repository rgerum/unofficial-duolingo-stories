'''
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

    def get_audio(self, VoiceId, text):
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
                ms = MP3(io.BytesIO(response.content)).info.length
                return response.content, ms
                #print("\nStatus code: " + str(response.status_code) +
                #      "\nYour TTS is ready for playback.\n")
        else:
            print("\nStatus code: " + str(response.status_code) +
                  "\nSomething went wrong. Check your subscription key and headers.\n")
            raise ValueError()
        
    def save_audio(self, filename, VoiceId, text):
        print("save_audio")
        self.get_token()

        marks = []
        for index, text2, text3 in add_marks(text):
            content, ms = self.get_audio(VoiceId, text2)
            content2, ms2 = self.get_audio(VoiceId, text3)

            marks.append(dict(markName=index, timeSeconds=ms2-ms))
        with Path(filename).open('wb') as audio:
            audio.write(content)

        return marks

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

def add_marks(text):
    import re

    regex_split_token = re.compile(r"(<[^>]+>)|(\w+)|([^\w<>]*)")

    def splitTextTokens(text, keep_tilde=True):
        return regex_split_token.findall(text)

    regex_combine_whitespace = re.compile(r" +")

    text = regex_combine_whitespace.sub(" ", text).strip()
    text2 = ""
    text_list = []
    i = 0
    open_tags = []
    for tag, text, space in splitTextTokens(text):
        if tag != "":
            text2 += tag

            close, name, self_close = re.match(r"<(/)?(\w*)[^\\]*(/)?>", tag).groups()
            if close is not None:
                if name in open_tags:
                    open_tags.remove(name)
            elif self_close is None:
                open_tags.append(name)
        elif text != "":
            i += len(text)
            text2 += text
        elif space != "":
            i += len(space)
            text2 += space
            text_list.append([i, text2+"".join([f"</{name}>" for name in open_tags[::-1]]), ""])
            text_list[-1][2] = text_list[-1][1] * 2
            text_list[-1][2] = text_list[-1][2].replace("</speak><speak>", "")

    return text_list

if __name__ == "__main__":
    text = '<speak>Marian, was zo moe   dat  ze  <prosody volume="silent">zout in haar koffie deed in plaats van suiker</prosody>.</speak>'
    #text2 = add_marks(text)
    #exit()
    app = Azure()
    app.get_token()
    app.save_audio("test.mp3", 'en-US-JennyNeural', text)
    # Get a list of voices https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#get-a-list-of-voices
    #app.get_voices_list()

'''


import azure.cognitiveservices.speech as speechsdk
import asyncio

def add_marks(text):
    import re

    regex_split_token = re.compile(r"(<[^>]+>)|(\w+)|([^\w<>]*)")

    def splitTextTokens(text, keep_tilde=True):
        return regex_split_token.findall(text)

    regex_combine_whitespace = re.compile(r" +")

    text = regex_combine_whitespace.sub(" ", text).strip()
    text2 = ""
    text_list = []
    i = 0
    open_tags = []
    for tag, text, space in splitTextTokens(text):
        if tag != "":
            #text2 += tag

            close, name, self_close = re.match(r"<(/)?(\w*)[^\\]*(/)?>", tag).groups()
            if close is not None:
                if name in open_tags:
                    open_tags.remove(name)
            elif self_close is None:
                open_tags.append(name)
        elif text != "":
            i += len(text)
            text2 += text
        elif space != "":
            i += len(space)
            text2 += space

    return text2


class Azure:
    speech_config = None

    def __init__(self):
        speech_key, service_region = "1444ab1cec6344e9969ba85b086d094f", "westeurope"
        self.speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)

    def get_voices_list(self):
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config)
        f = synthesizer.get_voices_async()
        voice_list = []
        for v in f.get().voices:
            voice_list.append([v.locale, v.short_name, str(v.gender.name).upper(), str(v.voice_type.name).upper()[len("ONLINE"):], "Microsoft Azure"])
        return voice_list

    def save_audio(self, filename, voice_id, text):
        last_pos = 0

        marks = []
        def boundary(w):
            nonlocal last_pos
            try:
                o = w.text_offset
                l = w.word_length
                t = w.audio_offset // 10_000
                word = text[o:o + l]
                last_pos = text2[last_pos:].find(word) + last_pos
                marks.append(dict(time=t, type="word", start=last_pos, end=len(word)+last_pos, value=word))
                print(word, last_pos, t, w)
            except Exception as e:
                print(e)

        self.speech_config.speech_synthesis_voice_name = voice_id

        audio_config = speechsdk.audio.AudioOutputConfig(filename=filename)

        synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config, audio_config=audio_config)

        synthesizer.synthesis_word_boundary.connect(boundary)
        f = synthesizer.speak_ssml_async(text)
        f.get()
        return {
            "output_file": str(filename),
            "marks": marks
        }

