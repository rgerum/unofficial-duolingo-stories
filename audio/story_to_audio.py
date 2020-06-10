import boto3
import json
from pathlib import Path

polly_client = boto3.Session(
    aws_access_key_id="AKIAIBJQ5Z3ENEMXS42Q",
    aws_secret_access_key="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",
    region_name='eu-central-1').client('polly')

def getSpeachMarks(VoiceId, Text):
    response = polly_client.synthesize_speech(VoiceId=VoiceId,
                                              OutputFormat='json',
                                              SpeechMarkTypes=["word"],
                                              Text=Text)
    print(response)
    text = response["AudioStream"].read().decode()
    return text

def saveAudio(filename, VoiceId, Text):
    response = polly_client.synthesize_speech(VoiceId=VoiceId,
                                                  OutputFormat='mp3',
                                                  Text=Text)
    print(response)
    with Path(filename).open('wb') as fp:
        fp.write(response['AudioStream'].read())

def responseToDict(resp):
    return [json.loads(x) for x in resp.split("\n") if x != ""]

story_id = 2
output_dir = Path(str(story_id))
output_dir.mkdir(exist_ok=True)

with open(f"story{story_id}.json", "rb") as fp:
    story = json.load(fp)

meta = story["meta"]
story = story["phrases"]

speakers = dict(default="Ruben")

for key in meta:
    if key.startswith("speaker"):
        speakers[key.split("_")[1]] = meta[key]

data = {}
for part in story:
    VoiceId = speakers[part.get("speaker", "default")]
    Text = None
    if part["tag"] == "phrase":
        Text = part["text"]
    else:
        Text = part.get("full_text", None)
    print(VoiceId, Text, part)

    if Text is not None:
        Text = Text.replace("~", " ")
        saveAudio(output_dir / f"speech_{story_id}_{part['id']}.mp3", VoiceId, Text)
        #print("-", responseToDict(data[str(part["id"])]), "-", sep="")
        data[part["id"]] = responseToDict(getSpeachMarks(VoiceId, Text))
        print(part["id"], speakers[part.get("speaker", "default")], part["text"].replace("~", " "))
        print(data)
        #exit()

with Path(output_dir / f"audio_{story_id}.json").open("w") as fp:
    json.dump(data, fp, indent=2)

VoideId = "Ruben"
Text = "Aafke huurt dit weekend een kamer bij Lonneke. Ze klopt op de deur."
if 0:
    response = polly_client.synthesize_speech(VoiceId=VoideId,
                    OutputFormat='json',
                    SpeechMarkTypes=["word"],
                    Text = Text)
    print(response)
    text = response["AudioStream"].read().decode()
    print(text)
if 0:
    response = polly_client.synthesize_speech(VoiceId=VoideId,
                                              OutputFormat='mp3',
                                              Text=Text)
    print(response)
    file = open('speech.mp3', 'wb')
    file.write(response['AudioStream'].read())
    file.close()