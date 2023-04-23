const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
var fs = require('fs');

const text = 'Hello, <mark name="first_sentence_end"/> world!';

const request = {
    input: {text: text},
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    audioConfig: {audioEncoding: 'MP3', enable_time_pointing: 'SSML_MARK'},
};

client.synthesizeSpeech(request, (err, response) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log(response.timepoints)
    const audioContent = response.audioContent;
    const outputFile = 'output.mp3';
    fs.writeFile(outputFile, audioContent, (err) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        console.log(`Audio file written to ${outputFile}`);
    });
});
