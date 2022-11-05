import mysql.connector
from pathlib import Path

class Query:
    def __init__(self, query):
        self.query = query

    def __enter__(self):
        self.cursor = cnx.cursor()
        self.cursor.execute(self.query)
        return self.cursor

    def __exit__(self, *args):
        cursor.close()

cnx = mysql.connector.connect(user='carex', password='5hfW-18MSXgYvjrewhbP',
                              host='localhost',
                              database='carex_stories')


with Query("SELECT id, short FROM language") as cursor:
    language_lookup = {}
    for (id, short) in cursor:
        language_lookup[short] = id
    print(language_lookup)

with Query("SELECT speaker FROM speaker") as cursor:
    speaker_list = [speaker for speaker, in cursor]
    print(speaker_list)

voices = []
import sys
sys.path.append("../../audio")
print(list(Path("../../audio/tts").glob("*.py")))
from tts.aws_polly import AmazonPolly
app = AmazonPolly()
voices.extend(app.get_voices_list())
#print(voices)

from tts.google import Google
app = Google()
voices.extend(app.get_voices_list())

from tts.azure_tts_old import Azure
app = Azure()
voices.extend(app.get_voices_list())

from tts.abair import Abair
app = Abair()
voices.extend(app.get_voices_list())

output = []
for voice in voices:
    if voice[0] not in language_lookup:
        voice[0] = voice[0].split("-")[0]
    if voice[0] in language_lookup:
        if voice[1] not in speaker_list:
            output.append(dict(language_id=language_lookup[voice[0]], speaker=voice[1], gender=voice[2], type=voice[3], service=voice[4]))
            print(voice[0], output[-1])


cursor = cnx.cursor()
add_speaker = ("INSERT INTO speaker "
              "(language_id, speaker, gender, type, service) "
              "VALUES (%(language_id)s, %(speaker)s, %(gender)s, %(type)s, %(service)s)")
for data_speaker in output:
    cursor.execute(add_speaker, data_speaker)
cnx.commit()

cnx.close()