import json


with open("../../sql_dump/carex_stories_language.json") as fp:
    language = json.load(fp)
language_lookup = {}
for lang in language:
     language_lookup[lang["short"]] = lang["id"]
print(language_lookup)

voices = []

from aws_polly import AmazonPolly
app = AmazonPolly()
voices.extend(app.get_voices_list())

from google import Google
app = Google()
voices.extend(app.get_voices_list())

from azure import Azure
app = Azure()
voices.extend(app.get_voices_list())

from abair import Abair
app = Abair()
voices.extend(app.get_voices_list())

output = []
index = 1
for voice in voices:
    if voice[0] not in language_lookup:
        voice[0] = voice[0].split("-")[0]
    if voice[0] in language_lookup:
        voice[0] = language_lookup[voice[0]]
        output.append(dict(index=index, language_id=voice[0], speaker=voice[1], gender=voice[2], type=voice[3], service=voice[4]))
        index += 1
    print(voice)

with open("speakers.json","w") as fp:
    json.dump(output, fp, indent=2)
