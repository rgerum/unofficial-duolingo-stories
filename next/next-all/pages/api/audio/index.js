import {getToken} from "next-auth/jwt";
import engine_azure from "../../../lib/audio/azure_tts";
import engine_google from "../../../lib/audio/google.mjs";
import engine_polly from "../../../lib/audio/polly";
var fs = require('fs');
const { uuid } = require('uuidv4');

async function mkdir(folderName) {
    return new Promise((resolve, reject) => {
        fs.mkdir(folderName, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve();
                console.log(`Folder '${folderName}' created successfully`);
            }
        });
    });
}

async function exists(filename){
    return new Promise((resolve, reject) => {
        fs.access(filename, (err) => {
            if (err) {
                resolve(false)
            } else {
                resolve(true);
            }
        });
    });
}

export default async function api(req, res) {
    try {
        const token = await getToken({ req })

        if(!token?.role)
            return res.status(401).json("You need to be a registered contributor.");

        let id = parseInt(req.body.id);
        let speaker = req.body.speaker;
        let text = req.body.text;
        let filename = `public/audio/${id}`;
        try {
            await mkdir(filename);
        }
        catch (e) {}
        while(true) {
            filename += "/" + uuid().split("-")[0] + ".mp3";
            if(!await exists(filename))
                break;
        }

        let answer;
        if(await engine_google.isValidVoice(speaker)) {
            answer = await engine_google.synthesizeSpeech(filename, speaker, text);
            answer.engine = "google";
        }
        else if(await engine_azure.isValidVoice(speaker)) {
            answer = await engine_azure.synthesizeSpeech(filename, speaker, text);
            answer.engine = "azure";
        }
        else {
            answer = await engine_polly.synthesizeSpeech(filename, speaker, text);
            answer.engine = "polly";
        }
        answer.output_file = answer.output_file.substring('public/'.length)

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message, body: req.body });
    }
}
