import {getSession} from "next-auth/react";
import {get_avatar_names, get_language, get_speakers} from "../../../api/editor/avatar/[language]";
import Head from "next/head";
import styles from "../[language].module.css";
import React, {useState} from "react";
import EditorButton from "../../../../components/editor/editor_button";
import Flag from "../../../../components/layout/flag";
import Login from "../../../../components/login/login_dialog";
import {transcribe_text} from "../../../../lib/editor/tts_transcripte.mjs";
import {useInput} from "../../../../lib/hooks";
import {PlayButton, SpeakerEntry} from "../[language]";
import {fetch_post} from "../../../../lib/fetch_post";

export default function Page({language, speakers}) {
    // Render data...                <AvatarNames language={language} speakers={speakers} avatar_names={avatar_names}/>
    let [data, setData] = useInput(language.tts_replace || `
# here you can add single letters that should be replaced    
LETTERS:
    o: u
    e: i
# here you can add parts of words to be replaced. You can use valid regular expressions (regex) here
FRAGMENTS:
    ion\\b: flug
    sem: dem
# whole words that should be replaced
WORDS:
    oh: uuuh
    Worcester: WOO-STER
`)
    let [text, setText] = useInput("Enter a text to be spoken");
    let [text2, setText2] = React.useState("");
    let [customSpeaker, setCustomSpeaker] = useInput("");
    const [pitch, setPitch] = useState(2);
    const [speed, setSpeed] = useState(2);

    async function save() {
        let d = {
            id: language.id,
            tts_replace: data,
        };
        let response = await fetch_post(`/api/editor/avatar/save_tts_replace`, d);
        if(response.status === 200)
            return await response.json();
        throw "error";
    }

    async function play2(e, text, name) {
        let text2 = await process()
        let speakText2 = `<prosody pitch="${["x-low", "low", "medium", "high", "x-high"][pitch]}" rate="${["x-slow", "slow", "medium", "fast", "x-fast"][speed]}">${text2}</prosody>`;
        let id = text+pitch+speed+name;
        return play(e, id, text, name, speakText2)
    }

    async function play(e, id, text, name, speakText) {

        //let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
        //    {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
        let response2 = await fetch_post(`/api/audio`,
            {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
        let ssml_response = await response2.json();

        let binaryString = window.atob(ssml_response.content);
        let binaryData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            binaryData[i] = binaryString.charCodeAt(i);
        }
        let blob = new Blob([binaryData], { type: "audio/mp3" });
        let url = URL.createObjectURL(blob);
        let audio = new Audio();
        audio.src = url;

        audio.play();


        e.preventDefault();
    }
    async function process() {
        await save();
        let [text2, ] = transcribe_text(text, data);
        setText2(text2);
        return text2;
    }
    return <>
        <Head>
            <title>Duostories: improve your Duolingo learning with community translated Duolingo stories.</title>
            <link rel="canonical" href={`https://duostories.org/editor/language/${language.id}`} />
            <meta name="description" content={`Contribute by translating stories.`}/>
            <meta name="keywords" content={`language, learning, stories, Duolingo, community, volunteers`}/>
        </Head>
        <Layout language_data={language}>
            <div className={styles.root + " " + styles.characterEditorContent}>
                <div className={styles.speaker_list + " " + (speakers?.length > 0 ? "": styles.noVoices)}>
                    <div className={styles.slidecontainer}>
                        Pitch: <input type="range" min="0" max="4" value={pitch} id="pitch" onChange={(e)=>setPitch(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.slidecontainer}>
                        Speed: <input type="range" min="0" max="4" value={speed} id="speed" onChange={(e)=>setSpeed(parseInt(e.target.value))}/>
                    </div>
                    <div className={styles.tablecontainer}>
                        <table className={styles.story_list + " " +styles.voice_list} data-cy="voice_list" data-js-sort-table="true">
                            <thead>
                            <tr>
                                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Name</th>
                                <th data-js-sort-colnum="1">Gender</th>
                                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="2">Type</th>
                            </tr>
                            </thead>
                            <tbody>
                            {speakers.map((speaker, index) =>
                                <SpeakerEntry key={index} speaker={speaker} play={play2} />
                            )}
                            <tr>
                            <td><PlayButton play={play2} speaker={customSpeaker} name="Duo" /><input value={customSpeaker} onChange={setCustomSpeaker} /></td>
                                <td></td>
                                <td></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className={styles.avatar_editor + " " + (speakers?.length > 0? "": styles.noVoices)} style={{"overflowY": "scroll"}}>
                    <textarea defaultValue={data} onChange={setData} rows={20} cols={40}/>
                    <textarea defaultValue={text} onChange={setText}/>
                    <button onClick={process}>Process</button>
                    <span>{text2}</span>
                </div>

            </div>
        </Layout>
    </>
}


export function Layout({ children, language_data }) {
    /*
    <CourseDropdown userdata={userdata} />
    <Login userdata={userdata} />
    */
//const { userdata, error } = useSWR('https://test.duostories.org/stories/backend_node_test/session', fetch)

//if (error) return <div>failed to load</div>
//if (!userdata) return <div>loading...</div>

    return (
        <>
            <nav className={styles.header_index}>
                <EditorButton id="button_back" href={`/editor`} data-cy="button_back" img={"back.svg"} text={"Back"} style={{paddingLeft: 0}}/>
                <b>TTS-Editor</b>
                <Flag iso={language_data.short} width={40} flag={language_data.flag} flag_file={language_data.flag_file}/>
                <span data-cy="language-name" className={styles.AvatarEditorHeaderFlagName}>{language_data.name}</span>
                <div style={{marginLeft: "auto"}}></div>
                <Login page={"editor"}/>
            </nav>
            <div className={styles.main_index}>
                {children}
            </div>
        </>
    )
}

export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {redirect: {destination: '/editor/login', permanent: false,},};
    }
    if (!session.user.role) {
        return {redirect: {destination: '/editor/not_allowed', permanent: false,},};
    }

    let language = await get_language(context.params.language);

    if(!language) {
        return {
            notFound: true,
        }
    }

    let speakers = await get_speakers(context.params.language);
    let avatar_names = await get_avatar_names(context.params.language);

    // Pass data to the page via props
    return { props: { avatar_names, speakers, language } }
}
