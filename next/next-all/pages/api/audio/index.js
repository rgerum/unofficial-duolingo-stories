import {getToken} from "next-auth/jwt";
import {audio_engines} from "../../../lib/audio";
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
        let filename = undefined;
        let file;
        if(id !== 0) {
            filename = `public/audio/${id}`;
            try {
                await mkdir(filename);
            } catch (e) {
            }
            while (true) {
                file = uuid().split("-")[0] + ".mp3";
                filename += "/" + file;
                if (!await exists(filename))
                    break;
            }
        }

        let answer;
        for(let engine of audio_engines) {
            if(await engine.isValidVoice(speaker)) {
                answer = await engine.synthesizeSpeech(filename, speaker, text);
                answer.engine = engine.name;
                break;
            }
        }
        if(id !== 0) {
            answer.output_file = `${id}/` + file;
        }

        if(answer === undefined)
            return res.status(404).test("Error not found");

        return res.json(answer);
    }
    catch (err) {
        res.status(500).json({ message: err.message, body: req.body });
    }
}
