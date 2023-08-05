import {NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import { v4 as uuid } from 'uuid';
let fs = require('fs');
import {audio_engines} from "../_lib/audio";


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
    return new Promise((resolve) => {
        fs.access(filename, (err) => {
            if (err) {
                resolve(false)
            } else {
                resolve(true);
            }
        });
    });
}

export default async function POST(req) {
    try {
        const token = await getToken({ req })

        if(!token?.role)
            return new Response('You need to be a registered contributor.', {status: 401})

        let data = await req.json();
        let id = parseInt(data.id);
        let speaker = data.speaker;
        let text = data.text;
        let filename = undefined;
        let file;
        if(id !== 0) {
            filename = `../audio/${id}`;
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
            return new Response('Error not found.', {status: 404})

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}
