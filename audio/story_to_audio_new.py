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
text = sys.argv[3]

processLine2(story_id, speaker, text)
