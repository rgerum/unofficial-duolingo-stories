#!/usr/bin/env python3
import boto3
import json
import sys
from pathlib import Path

from transliterate import get_translit_function

from gtts import gTTS
from mutagen.mp3 import MP3

from .aws_polly import AmazonPolly
from .azure import Azure
from .google import Google
from .abair import Abair


def processLine(story_id, line_id):
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

    if Abair.checkVoiceId(ssml['speaker']):
        engine = Abair()
    elif "-Standard-" in ssml['speaker'] or "-Wavenet-" in ssml['speaker']:
        engine = Google()
    elif "-" in ssml['speaker']:
        engine = Azure()
    else:
        engine = AmazonPolly()

    # generate the audio
    engine.save_audio(output_dir / f"speech_{story_id}_{ssml['id']}.mp3", ssml['speaker'], ssml['text'])

    # generate the alignment
    print("pre", output_file, output_data.keys())
    output_data[f"{ssml['id']}"] = engine.get_speech_marks(ssml['speaker'], ssml['text'])
    print("alignment", ssml['id'])

    print("update json")
    # store the output data back in the json file
    with output_file.open("w") as fp:
        json.dump(output_data, fp, indent=2)

    print("dumped", output_file, output_data.keys())

    with output_file.open("rb") as fp:
        output_data = json.load(fp)
    print("post", output_file, output_data.keys())



def processLine2(story_id, speaker, text):
    import uuid
    # output file
    output_dir = Path(str(story_id))
    output_dir.mkdir(exist_ok=True)
    while True:
        id = str(uuid.uuid1()).split("-")[0]
        output_file = Path(output_dir / f"{id}.mp3")
        if not output_file.exists():
            break

    if Abair.checkVoiceId(speaker):
        engine = Abair()
    elif "-Standard-" in speaker or "-Wavenet-" in speaker:
        engine = Google()
    elif "-" in speaker:
        engine = Azure()
    else:
        engine = AmazonPolly()

    # generate the audio
    engine.save_audio(output_file, speaker, text)

    # generate the alignment
    output_data = {}
    #print("pre", output_file, output_data.keys())
    output_data["output_file"] = str(output_file)
    output_data["marks"] = engine.get_speech_marks(speaker, text)
    #print("alignment", speaker)

    #print("update json")
    print(json.dumps(output_data))
