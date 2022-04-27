#!/usr/bin/env python3
import boto3
import json
import sys
from pathlib import Path

from transliterate import get_translit_function

from gtts import gTTS
from mutagen.mp3 import MP3

from tts import processLine2

# the story and line ids from the command line
story_id = int(sys.argv[1])
speaker = sys.argv[2]
filename = sys.argv[3]
with open(filename, "rb") as fp:
    text = fp.read().decode("utf-8")

if not text.startswith("<speak"):
    text = "<speak>"+text+"</speak>"

print("story_id", story_id, file=sys.stderr)
print("speaker", speaker, file=sys.stderr)
print("text", text, len(text), type(text), file=sys.stderr)

try:
    processLine2(story_id, speaker, text, filename)
finally:
    Path(filename).unlink()
