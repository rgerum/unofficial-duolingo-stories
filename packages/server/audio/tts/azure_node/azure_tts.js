const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require('fs');

function get_raw(text) {
    text = text.replace(/ +/g, " ");
    let text2 = "";
    for(let m of text.matchAll(/(<[^>]+>)|(\w+)|([^\w<>]*)/g)) {
        if(m[1]) {

        }
        else if(m[2]) {
            text2 += m[2];
        }
        else if(m[3]) {
            text2 += m[3];
        }
    }
    return text2;
}


async function synthesizeSpeech(filename, voice_id, text, file) {
    return new Promise((resolve, reject) => {
        if (file)
            text = fs.readFileSync(file, 'utf8');
        const speechConfig = sdk.SpeechConfig.fromSubscription("1444ab1cec6344e9969ba85b086d094f", "westeurope");
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"

        // create the speech synthesizer.
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        var last_pos = 0;
        var marks = []
        var boundaryEvent = (w, v) => {
            //console.log(v)
            //console.log(text2.substring(last_pos))//
            last_pos = text2.substring(last_pos).search(v.privText) + last_pos
            let data = {
                time: parseInt(v.privAudioOffset / 10000),
                type: "word",
                start: last_pos,
                end: last_pos + v.privText.length,
                value: v.privText,
            }
            marks.push(data);
            //console.log(data)
        }
        //console.log(synthesizer.wordBoundary)
        synthesizer.wordBoundary = boundaryEvent

        text = text.replace(/^<speak>/, "")
        text = text.replace(/<\/speak>$/, "")
        let lang = voice_id.split("-")[0] + "-" + voice_id.split("-")[1]
        text = `<speak version='1.0' xml:lang='${lang}'><voice name="${voice_id}">${text}</voice></speak>`
        //text = "I am here</speak>"
        let text2 = get_raw(text);
        //console.log("text2", text2);
        //console.log("text", text);
        // start the synthesizer and wait for a result.
        synthesizer.speakSsmlAsync(text,
            function (result) {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    let output = {
                        output_file: filename,
                            marks: marks,
                    }
                    console.log(JSON.stringify(output));
                    resolve(output);
                } else {
                    console.error("Speech synthesis canceled, " + result.errorDetails +
                        "\nDid you update the subscription info?");
                    reject(result.errorDetails);
                }
                synthesizer.close();
                synthesizer = undefined;
            },
            function (err) {
                console.trace("err - " + err);
                synthesizer.close();
                synthesizer = undefined;
                reject(err);
            });
        //f.onWordBoundaryEvent = (w) => console.log(w)
        //console.log("Now synthesizing to: " + filename);

        // </code>
    });
}
let promise = synthesizeSpeech("path-to-file.wav", "en-US-JennyNeural", "<speak>Marian was zo moe   dat  ze  <prosody volume=\"silent\">zout in haar koffie deed in plaats van suiker</prosody>.</speak>")
console.log(promise)
//synthesizeSpeech(process.argv[2], process.argv[3], process.argv[4], process.argv[5])
//console.log("done", x)
//console.log(process.argv);