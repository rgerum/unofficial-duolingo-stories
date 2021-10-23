#!/usr/bin/env python3
import boto3
import json
import sys
from pathlib import Path

from transliterate import get_translit_function

from gtts import gTTS
from mutagen.mp3 import MP3

from tts import processLine

# the story and line ids from the command line
story_id = int(sys.argv[1])
line_id = sys.argv[2]

processLine(story_id, line_id)
sys.exit()

key_data = {}
with open("rootkey.csv", "r") as fp:
    for line in fp:
        key, value = line.strip().split("=")
        key_data[key] = value


polly_client = boto3.Session(
    aws_access_key_id=key_data["AWSAccessKeyId"],
    aws_secret_access_key=key_data["AWSSecretKey"],
    region_name='eu-central-1').client('polly')


def getSpeachMarks(VoiceId, Text, force_polly=False):
    """
    if meta["lang"] == "el" and not force_polly:
        length_google = MP3(last_filename).info.length
        saveAudio("tmp.mp3", speakers["default"], translit(Text, reversed=True))
        length_polly = MP3("tmp.mp3").info.length

        data = getSpeachMarks(speakers["default"], translit(Text, reversed=True), force_polly=True)
        for i in range(len(data)):
            data[i]["time"] = data[i]["time"] / length_polly * length_google
        return data
    """
    response = polly_client.synthesize_speech(VoiceId=VoiceId,
                                              OutputFormat='json',
                                              SpeechMarkTypes=["word"],
                                              Text=Text,
                                              TextType="ssml")
    print(response)
    text = response["AudioStream"].read().decode()
    return responseToDict(text)

last_filename = ""
def saveAudio(filename, VoiceId, Text):
    global last_filename
    last_filename = filename
    """
    if meta["lang"] == "el" or meta["lang"] == "tl":
        tts = gTTS(Text, lang=meta["lang"])
        tts.save(filename)
        return
    """
    #print("saveAudio", filename, VoiceId)#, Text)
    response = polly_client.synthesize_speech(VoiceId=VoiceId,
                                                  OutputFormat='mp3',
                                                  Text=Text,
                                                  TextType="ssml")
    print(response)
    with Path(filename).open('wb') as fp:
        fp.write(response['AudioStream'].read())

def responseToDict(resp):
    return [json.loads(x) for x in resp.split("\n") if x != ""]

# the story and line ids from the command line
story_id = int(sys.argv[1])
line_id = sys.argv[2]

# input file
input_file = Path(f"story{story_id}.json")

# output file
output_dir = Path(str(story_id))
output_dir.mkdir(exist_ok=True)
output_file = Path(output_dir / f"audio_{story_id}.json")

# read the input file
with input_file.open("rb") as fp:
    story = json.load(fp)

# read the output file
if output_file.exists():
    with output_file.open("rb") as fp:
        output_data = json.load(fp)
else:
    output_data = {}

# get the ssml data for this line
ssml = story[line_id]

# generate the audio
saveAudio(output_dir / f"speech_{story_id}_{ssml['id']}.mp3", ssml['speaker'], ssml['text'])

# generate the alignment
output_data[ssml['id']] = getSpeachMarks(ssml['speaker'], ssml['text'])
#print(output_data[ssml['id']])

# store the output data back in the json file
with output_file.open("w") as fp:
    json.dump(output_data, fp, indent=2)

"""
meta = story["meta"]
story = story["phrases"]
speakers = dict(default="Ruben")
print(meta["lang"])

#raise ValueError
#exit()
if meta["lang"] == "no":
    speakers = dict(default="Liv")
if meta["lang"] == "sv":
    speakers = dict(default="Astrid")
if meta["lang"] == "ru":
    speakers = dict(default="Maxim")
if meta["lang"] == "ja":
    speakers = dict(default="Takumi")
if meta["lang"] == "zh":
    speakers = dict(default="Zhiyu")
if meta["lang"] == "it":
    speakers = dict(default="Bianca")
if meta["lang"] == "el":
    speakers = dict(default="Bianca")  # hack use italian
if meta["lang"] == "hi":
    speakers = dict(default="Aditi")
if meta["lang"] == "tl":
    speakers = dict(default="Conchita")  # hack use spanish
if meta["lang"] == "tr":
   speakers = dict(default="Filiz")
if meta["lang"] == "is":
  speakers = dict(default="Dora")

try:
    translit = get_translit_function(meta["lang"])
except:
    def func(x, *args, **kwargs):
        return x
    translit = func

for key in meta:
    if key.startswith("speaker"):
        speakers[key.split("_")[1]] = meta[key]

data = {}
for part in story:
    try:
        VoiceId = speakers[part.get("speaker", "default")]
    except KeyError:
        VoiceId = speakers["default"]
    print(VoiceId, '"'+VoiceId+'"')
    #exit()
    Text = None
    if part["tag"] == "phrase" or part["tag"] == "title":
        if "speech" in part:
            Text = part["speech"]
        else:
            Text = part["text"]
    else:
        if "speech" in part:
            Text = part["speech"]
        else:
            Text = part.get("full_text", None)
    #print(VoiceId, Text, part)

    if Text is not None:
        Text = Text.replace("~", " ")
        saveAudio(output_dir / f"speech_{story_id}_{part['id']}.mp3", VoiceId, Text)
        #print("-", responseToDict(data[str(part["id"])]), "-", sep="")
        data[part["id"]] = getSpeachMarks(VoiceId, Text)
        #print(part["id"], speakers[part.get("speaker", "default")], part["text"].replace("~", " "))
        #print(data)
        #exit()

with Path(output_dir / f"audio_{story_id}.json").open("w") as fp:
    json.dump(data, fp, indent=2)

print("finished")
"""