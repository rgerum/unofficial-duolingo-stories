// Load the AWS SDK for Node.js
var {
        Polly
    } = require("@aws-sdk/client-polly");
var fs = require('fs');

// Set the region and credentials for the AWS SDK
let config = {
    region: 'eu-central-1',
    accessKeyId: 'AKIAJZSYIYKK23WBAMHA',
    secretAccessKey: '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'
};


async function synthesizeSpeech(filename, voice_id, text) {
    return new Promise((resolve, reject) => {
        // Create an instance of the Polly service object
        var polly = new Polly(config);

        text = text.replace(/^<speak>/, "")
        text = text.replace(/<\/speak>$/, "")

        // Set the parameters for the synthesis request
        var params = {
            OutputFormat: 'mp3',
            Text: `<speak>${text}</speak>`,
            VoiceId: voice_id,
            TextType: "ssml",
        };

        // Call the synthesizeSpeech method to generate the audio
        polly.synthesizeSpeech(params, function (err, data) {
            if (err) {
                reject(err);
                console.log(err, err.stack);
            }
            else {
                params.SpeechMarkTypes = ["word"];
                params.OutputFormat = "json";
                polly.synthesizeSpeech(params, function (err, data2) {
                    if (err) {
                        console.log(err, err.stack);
                        reject(err);
                    }
                    else {
                        // Handle the audio data
                        console.log(data.AudioStream);
                        console.log(data2.AudioStream.toString());
                        fs.writeFile(filename, data.AudioStream, function (err) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            }
                            else {
                                let marks = [];
                                for(let mark of data2.AudioStream.toString().trim().split("\n"))
                                    marks.push(JSON.parse(mark))
                                let output = {
                                    output_file: filename,
                                    marks: marks,
                                }
                                console.log('Audio saved to file: output.mp3');
                                resolve(output);
                            }
                        });
                    }
                });
            }
        });
    });
}
async function getVoices() {
    return new Promise((resolve, reject) => {
        var polly = new Polly(config);
        polly.describeVoices({}, (err, data) => {
            if (err) {
                console.log('Error:', err);
            } else {
                console.log('Available Voices:', data.Voices);
            }
        });
    });
}
async function main() {
    //let res = await synthesizeSpeech("test.mp3", "Joanna", "Hello world!");
    let res = getVoices();
    console.log("end", res)
}
main()