import React from 'react';
import {useEventListener} from './hooks.js'
import {shuffle} from './includes.mjs'
import './story.css';

let backend = "https://carex.uber.space/stories/backend/"
let backend_stories = backend+"stories/"
window.backend_stories = backend_stories

let audio_right = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3");
audio_right.volume = 0.5;
let audio_wrong = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3");
audio_wrong.volume = 0.5;
let audio_finished = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3");
audio_finished.volume = 0.5;

function playSoundRight() {
    audio_right.pause();
    audio_right.currentTime = 0;
    audio_right.play();
}
function playSoundWrong() {
    audio_wrong.pause();
    audio_wrong.currentTime = 0;
    audio_wrong.play();
}

async function setStoryDone(id) {
    await fetch(`${backend_stories}set_story_done.php?id=${id}`);
}

function AudioPlay(props) {
    if(props.onClick === undefined)
        return <></>
    return <img onClick={props.onClick} src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
                className="loudspeaker" alt="speaker" />;
}

function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}~]+)/)
}

function HintLineContent(props) {
    var content = props.content;
    var audioRange = props.audioRange;
    var hideRangesForChallenge = props.hideRangesForChallenge;

    function getOverlap(start1, end1, start2, end2) {
        if(start2 === end2)
            return false;
        if(start2 === undefined || end2 === undefined)
            return false;
        if(start1 <= start2 && start2 < end1)
            return true;
        return start2 <= start1 && start1 < end2;

    }

    function addWord2(start, end) {
        return <span className="word"
                     key={start+" "+end}
                     style={audioRange < start ? {opacity: 0.5} : {}}
                     data-hidden={hideRangesForChallenge !== undefined &&
                     getOverlap(start, end, hideRangesForChallenge.start, hideRangesForChallenge.end) ? true : undefined}
        >{content.text.substring(start, end)}</span>
    }

    function addSplitWord(start, end) {
        let parts = splitTextTokens(content.text.substring(start, end));
        if(parts[0] === "")
            parts.splice(0, 1);
        if(parts[parts.length-1] === "")
            parts.pop()

        if(parts.length === 1) {
            return addWord2(start, end)
            //addWord(dom, start, end);
            //return dom;
        }
        let elements = [];
        for(let p of parts) {
            elements.push(addWord2(start, start+p.length));
            start += p.length;
        }
        // <span className="word">{content.text.substring(text_pos, hint.rangeFrom)}</span>
        return elements;
    }

    var elements = [];
    let text_pos = 0;
    // iterate over all hints
    for(let hint of content.hintMap) {
        // add the text since the last hint
        if(hint.rangeFrom > text_pos)
            elements.push(addSplitWord(text_pos, hint.rangeFrom))
        //addSplitWord(dom.append("span").attr("class", "word"), text_pos, hint.rangeFrom);

        // add the text with the hint
        elements.push(<span key={hint.rangeFrom + " "+hint.rangeTo+1} className="word tooltip">{addSplitWord(hint.rangeFrom, hint.rangeTo+1)}<span className="tooltiptext">{content.hints[hint.hintIndex]}</span></span>)
        //addSplitWord(dom.append("span").attr("class", "word tooltip"), hint.rangeFrom, hint.rangeTo+1)
        //    .append("span").attr("class", "tooltiptext").text(content.hints[hint.hintIndex]);
        // advance the position
        text_pos = hint.rangeTo+1;
    }
    // add the text after the last hint
    if(text_pos < content.text.length)
        elements.push(addSplitWord(text_pos, content.text.length))
//            addSplitWord(dom.append("span").attr("class", "word"), text_pos, content.text.length);

    return elements
}

function useChoiceButtons(count, rightIndex, callRight, callWrong) {
    let [buttonState, setButtonState] = React.useState([...new Array(count)]);

    function click(index) {
        if(buttonState[index] !== undefined)
            return
        if(index === rightIndex) {
            setButtonState(buttonState => buttonState.map((v, i) =>
                i === index ? "right" :
                    v === "false" ? "false-done" : "done"
            ))
            callRight();
        }
        else {
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? "false" : v))
            callWrong();
        }
    }

    return [buttonState, click]
}

function useArrangeButtons(order, callRight, callWrong, callAdvance) {
    let [buttonState, setButtonState] = React.useState([...new Array(order.length)]);
    let [position, setPosition] = React.useState(0);

    function click(index) {
        if(buttonState[index] === 1)
            return

        if(position === order[index]) {
            if(position === order.length-1)
                callRight();
            callAdvance(position);
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? 1 : v))
            setPosition(position + 1)
        }
        else {
            setTimeout(()=>{setButtonState(buttonState => buttonState.map((v, i) => (i === index && v === 2) ? 0 : v))}, 820);
            setButtonState(buttonState => buttonState.map((v, i) => i === index ? 2 : v))
            callWrong();
        }
    }

    return [buttonState, click]
}

function useCallOnActivation(index, handler) {
    useEventListener("progress_changed", e => {
        if(e.detail === index)
            handler();
    })
}

function useCallOnNextClicked(index, handler) {
    useEventListener("next_button_clicked", e => {
        if(e.detail === index)
            handler();
    })
}

function QuestionMultipleChoice(props) {
    let element = props.element;
    //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(props.editor) return;
            props.controls.unhide(props.element.trackingProperties.line_index);
            props.controls.right();
        },
        props.controls.wrong
    );

    if(props.editor) {
        hidden2 = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden2 = "story_selection";
    }

    return <div className={"fadeGlideIn "+hidden2}>
        {element.question ?
            <span className="question">
                    <HintLineContent content={element.question} />
                    </span> : null
        }
        <ul className="multiple_choice_ul">
            {element.answers.map((answer, index) => (
                <li key={index} className="multiple_choice_li"
                    onClick={()=>click(index)}
                    data-right={buttonState[index] === "right" ? "true" : undefined}
                    data-off={buttonState[index] === "right" || buttonState[index] === "false-done" ? "true" : undefined}
                    data-false={buttonState[index] === "false" ? "true" : undefined}
                >
                    <button className="multiple_choice_checkbox"/>
                    <div className="multiple_choice_answer_text">
                        <HintLineContent content={answer} />
                    </div>
                </li>
            ))}
        </ul>
    </div>
}

function QuestionSelectPhrase(props) {
    let element = props.element;
    //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""
    if(props.editor) {
        hidden2 = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden2 = "story_selection";
    }

    useCallOnActivation(element.trackingProperties.line_index, props.controls.block_next);
    let [buttonState, click] = useChoiceButtons(element.answers.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                props.controls.unhide(props.element.trackingProperties.line_index);
                props.controls.right();
            }
        },
        props.controls.wrong
    );

    return <div className={"fadeGlideIn "+hidden2}>
        <div>
            {element.answers.map((answer, index) => (
                <button key={index} className="answer_button"
                        onClick={() => click(index)}
                        data-status={(buttonState[index] === "right") ? "right" :
                            (buttonState[index] === "false-done" || buttonState[index] === "done") ? "off" :
                                (buttonState[index] === "false") ? "inactive" : undefined
                        }
                >
                    {answer.text ? answer.text : answer}
                </button>
            ))}
        </div>
    </div>
}

function QuestionArrange(props) {
    let element = props.element;
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""
    if(props.editor) {
        hidden2 = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden2 = "story_selection";
    }

    let [buttonState, click] = useArrangeButtons(element.phraseOrder, props.controls.right, props.controls.wrong,
        (i) => {if(!props.editor) props.controls.unhide(element.trackingProperties.line_index,
            element.characterPositions[i])})

    return <div style={{textAlign: "center"}} className={"fadeGlideIn "+hidden2}>
        <div>
            {element.selectablePhrases.map((phrase, index) => (
                <span key={index} className="word_order"
                      data-status={[undefined, "off", "wrong"][buttonState[index]]}
                      onClick={()=>click(index)}>{phrase}</span>
            ))}
        </div>
    </div>
}

class QuestionMatch extends React.Component {
    constructor(props) {
        super(props);
        this.createOrder(props);

        //this.props.controls.block_next();
        window.addEventListener("progress_changed", this.progress_changed.bind(this))
    }

    createOrder(props) {
        let clicked = [];
        this.order = [];
        for(let i in props.element.fallbackHints) {
            this.order.push([i, 0]);
            this.order.push([i, 1]);
            clicked.push(undefined); clicked.push(undefined);
        }
        shuffle(this.order);

        this.state = {
            clicked: clicked,
            last_clicked: undefined,
        };
    }

    progress_changed(e) {
        if(e.detail === this.props.element.trackingProperties.line_index)
            this.props.controls.block_next();
    }

    click(index) {
        // do no allow to click on finished words again
        if(this.state.clicked[index] === "right")
            return
        // select the word
        if(this.state.last_clicked === undefined)
            this.setState(state=>({last_clicked: index, clicked:state.clicked.map((item, i) => i === state.last_clicked ? undefined : i === index ? "selected" : item)}))
        // deselect the word
        else if(this.state.last_clicked === index)
            this.setState(state=>({last_clicked: undefined, clicked:state.clicked.map((item, i) => i === state.last_clicked ? undefined : i === index ? "selected" : item)}))
        // the pair is right
        else if(this.order[this.state.last_clicked][0] === this.order[index][0]) {
            this.setState(state => ({
                last_clicked: undefined,
                clicked: state.clicked.map((item, i) => i === state.last_clicked ? "right" : i === index ? "right" : item)
            }))
            let right_count = this.state.clicked.map((item, i)=>(item === "right")).reduce((a,b)=>a+b, 0);
            if(right_count >= this.state.clicked.length-2)
                this.props.controls.right();
        }
        // the pair is wrong
        else if(this.order[this.state.last_clicked][0] !== this.order[index][0]) {
            let last_clicked = this.state.last_clicked;
            this.setState(state => ({
                last_clicked: undefined,
                clicked: state.clicked.map((item, i) => i === state.last_clicked ? "wrong" : i === index ? "wrong" : item)
            }))
            setTimeout(()=>this.setState(state=> (
                {clicked: state.clicked.map((item, i) => ((i === index || i === last_clicked) && item === "wrong") ? undefined : item)}
            )), 1500);
        }
    }

    render() {
        let props = this.props;
        // when the number of elements changed in the editor
        if(this.order.length/2 !== props.element.fallbackHints.length)
            this.createOrder(props);
        let element = props.element;
        //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
        let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""
        if(props.editor) {
            hidden2 = "";
            if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
                hidden2 = "story_selection";
        }
        return <div className={"fadeGlideIn "+hidden2}>
            <span className="question">{element.prompt}</span>
            <div style={{textAlign: "center"}}>
                {this.order.map((phrase, index) => (
                    <button key={index} className="word_match"
                            data-status={this.state.clicked[index]}
                            onClick={()=>this.click(index)}>{element.fallbackHints[phrase[0]][["phrase", "translation"][phrase[1]]]}</button>
                ))}
            </div>
        </div>
    }
}

function QuestionPointToPhrase(props) {
    let element = props.element;
    let hidden = "";
    if(props.hidden)
        hidden = "hidden";
    if(props.editor) {
        hidden = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden = "story_selection";
    }

    let button_indices = {};
    for(let [index, part] of Object.entries(element.transcriptParts))
        if(part.selectable) button_indices[index] = Object.keys(button_indices).length;

    let [buttonState, click] = useChoiceButtons(element.transcriptParts.length, element.correctAnswerIndex,
        ()=> {
            if(!props.editor) {
                props.controls.unhide(props.element.trackingProperties.line_index);
                props.controls.right();
            }
        },
        props.controls.wrong
    );

    return <div className={hidden}>
        <div className="question">
            <HintLineContent content={element.question} />
        </div>
        <div>
            {element.transcriptParts.map((part, index) => (
                part.selectable ?
                    <div className="word_button"
                         key={index}
                         onClick={()=>click(button_indices[index])}
                         data-status={(buttonState[button_indices[index]] === "right") ? "right" :
                             (buttonState[button_indices[index]] === "false-done" || buttonState[button_indices[index]] === "done") ? "off" :
                                 (buttonState[button_indices[index]] === "false") ? "wrong" : undefined}
                    >{part.text}</div> :
                    <span key={index}>{part.text}</span>
            ))}
        </div>
    </div>
}

function ChallengePrompt(props) {
    let element = props.element;
    //let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""
    if(props.editor) {
        hidden2 = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden2 = "story_selection";
    }
    return <div className={"fadeGlideIn "+hidden2}>
                <span className="question">
                    <HintLineContent content={element.prompt} />
                </span>
    </div>
}

function StoryLine(props) {
    if(props.element.type === "MULTIPLE_CHOICE") {
        return <QuestionMultipleChoice editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "SELECT_PHRASE") {
        return <QuestionSelectPhrase editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "CHALLENGE_PROMPT") {
        return <ChallengePrompt editor={props.editor} controls={props.controls} progress={props.progress} element={props.element}/>
    }
    if(props.element.type === "ARRANGE") {
        return <QuestionArrange editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "POINT_TO_PHRASE") {
        return <QuestionPointToPhrase editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "MATCH") {
        return <QuestionMatch editor={props.editor} controls={props.controls} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "LINE") {
        return <TextLine editor={props.editor} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "HEADER") {
        return <Header editor={props.editor} progress={props.progress} element={props.element} />
    }
    if(props.element.type === "ERROR") {
        return <div className={["error"]}>{props.element.text}</div>
    }
    return null;
}

var audio_base_path = "https://carex.uber.space/stories/";
function useAudio(element) {
    let [audioRange, setAudioRange] = React.useState(99999);
    let audio = element?.line?.content?.audio;

    if(audio === undefined)
        audio = element?.learningLanguageTitleContent?.audio;

    useEventListener("progress_changed", e => {
        if(audio === undefined)
            return
        if(e.detail === element.trackingProperties.line_index) {
            if(audio && audio.url)
                playAudio();
        }
    })

    if(audio === undefined || audio.url === undefined)
        return [10000000, undefined]

    let audioObject = new Audio(audio_base_path + audio.url);

    function playAudio() {
        audioObject.pause();
        audioObject.currentTime = 0;
        audioObject.play();
        for(let keypoint of audio.keypoints) {
            setTimeout(() => {
                setAudioRange(keypoint.rangeEnd);
            }, keypoint.audioStart);
        }
    }

    return [audioRange, playAudio];
}

function Header(props) {
    let element = props.element;
    let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    //let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    if(props.hidden)
        hidden = "hidden";

    if(props.editor) {
        hidden = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden = "story_selection";
    }

    let [audioRange, playAudio] = useAudio(element)

    let hideRangesForChallenge = undefined;
    // <!--                    <span className="audio_reload" id={"audio_reload"+element.line.content.audio.ssml.id} onClick={() => generate_audio_line(window.story_json, element.line.content.audio.ssml.id)}></span>-->
    return <div className={"title fadeGlideIn "+hidden} style={{textAlign: "center"}}>
                <div><img alt="title image" className="title_img" src={element.illustrationUrl} /></div>
                <span className="title">
                    <AudioPlay onClick={playAudio} />
                    <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.learningLanguageTitleContent} />
                </span>
    </div>;
}


function TextLine(props) {
    let element = props.element;
    let hidden = (props.progress < element.trackingProperties.line_index) ? "hidden": ""
    //let hidden2 = (props.progress !== element.trackingProperties.line_index) ? "hidden": ""

    if(props.hidden)
        hidden = "hidden";

    if(props.editor) {
        hidden = "";
        if(props.element.editor && props.element.editor.start_no <= props.editor.line_no && props.editor.line_no < props.element.editor.end_no)
            hidden = "story_selection";
    }

    let [audioRange, playAudio] = useAudio(element)

    if(element.line === undefined)
        return <></>

    let hideRangesForChallenge = element.hideRangesForChallenge;
    if(props.progress !== element.trackingProperties.line_index)
        hideRangesForChallenge = undefined;
    // <!--                    <span className="audio_reload" id={"audio_reload"+element.line.content.audio.ssml.id} onClick={() => generate_audio_line(window.story_json, element.line.content.audio.ssml.id)}></span>-->
    if (element.line.type === "TITLE")
        return <div className={"title fadeGlideIn "+hidden}>
                    <span className="title">
                        <AudioPlay onClick={playAudio} />
                        <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.line.content} />
                    </span>
        </div>;
    else if (element.line.avatarUrl)
        return <><div className={"phrase fadeGlideIn "+hidden} lineno={props.element?.editor?.start_no}>
            <img className="head" src={element.line.avatarUrl} alt="head"/>
            <span className="bubble">
                        <AudioPlay onClick={playAudio} />
                        <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.line.content} />
                {(props.editor && (element.line.content.audio)) ?
                <><br/>
                    <span className="ssml_speaker">{element.line.content.audio.ssml.speaker}</span>
                    <span className="ssml">{element.line.content.audio.ssml.text}</span>
                    <span className="ssml_reload" onClick={() => window.generate_audio_line(element.line.content.audio.ssml)}>Ö</span>
                </> : <></>
                }
            </span>

        </div>
</>
    ;

    else
        return <div className={"phrase fadeGlideIn "+hidden}>
                <span>
                    <AudioPlay onClick={playAudio} />
                    <HintLineContent audioRange={audioRange} hideRangesForChallenge={hideRangesForChallenge} content={element.line.content} />
                </span>
        </div>;
}

function Part(props) {
    let challenge_type = props.part[props.part.length-1].trackingProperties.challenge_type;

    let [progress, setProgress] = React.useState(0);

    let next = () => {props.controls.advance_progress();}
    if(challenge_type === "point-to-phrase") {
        next = () => {
            if (progress === 0) {
                props.controls.block_next();
                setProgress(1);
            } else {
                props.controls.advance_progress();
                setProgress(2);
            }
        }
    }
    useCallOnNextClicked(props.part[0].trackingProperties.line_index, next);

    if(challenge_type === "point-to-phrase") {
        return <div>
            <TextLine editor={props.editor} progress={props.progress} element={props.part[0]} hidden={(!(progress === 0 || progress === 2)) && !props.editor}/>
            <QuestionPointToPhrase editor={props.editor} controls={props.controls} progress={props.progress} element={props.part[1]} hidden={!(progress === 1)} />
        </div>
    }
    let hidden = (props.progress < props.part[0].trackingProperties.line_index) ? "hidden": ""
    if(props.editor) hidden = "";
    return <div className={"part "+hidden} data-challengetype={challenge_type}>
        {props.part.map((element, i) => (
            <StoryLine key={i} editor={props.editor} controls={props.controls} progress={props.progress} element={element} />
        ))}
    </div>
}

function FinishedPage(props) {
    /* The page at the end of the story. */
    return <div className="page_finished">
        <div>
            <div className="finished_image_container">
                {/* add the three blinking stars */}
                <div>
                    <div className="star1" />
                    <div className="star2" />
                    <div className="star3" />
                </div>
                {/* the icon of the story which changes from color to golden */}
                <div className="finished_image">
                    <img src={props.story.illustrations.active} alt=""/>
                    <img src={props.story.illustrations.gilded} className="image_golden" alt=""/>
                </div>
            </div>
            {/* the text showing that the story is done */}
            <h2>Story complete!</h2><p>You finished "{props.story.fromLanguageName}"</p>
        </div>
    </div>
}

export class Story extends React.Component {
    constructor(props) {
        super(props);
        //let urlParams = new URLSearchParams(window.location.search);

        this.state = {
            courses: [],
            stories: [],
            lang: undefined,
            lang_base: undefined,
            loading: true,
            login: undefined,
            story: undefined,
            progress: 0,
            blocked: false,
            right: false,
            spacer: 0,
        };

        this.controls = {
            wrong: this.wrong.bind(this),
            right: this.right.bind(this),
            block_next: this.block_next.bind(this),
            unhide: this.unhide.bind(this),
            setNextCallback: this.setNextCallback.bind(this),
            next: this.next.bind(this),
            advance_progress: this.advance_progress.bind(this),
        }
        this.next_callback = undefined;

        window.addEventListener("story_id_changed", this.story_id_changed.bind(this))
        if(this.props.story_id)
            this.loadData(this.props.story_id)
        /*else if(this.props.story) {
            console.log("set the storz", this.props.story)
            this.setState({story: this.props.story, progress: 0});
        }*/
    }

    story_id_changed(e) {
        this.loadData(e.detail);
    }

    async loadData(name) {
        let story_json = await getStoryJSON(name);
        this.setState({story: story_json, progress: 0});
    }

    setNextCallback(callback) {
        this.next_callback = callback;
    }

    next() {
        if(!this.state.blocked)
            dispatchEvent(new CustomEvent('next_button_clicked', {detail: this.state.progress}));
    }

    advance_progress() {
        dispatchEvent(new CustomEvent('progress_changed', {detail: this.state.progress + 1}));
        this.setState(state=>({progress: state.progress += 1, right: false}));
    }

    unhide(index, pos) {
        this.setState(state=>{
            let story = state.story;
            for(let element of story.elements) {
                if(element.trackingProperties.line_index === index && element.hideRangesForChallenge !== undefined) {
                    if(pos === undefined)
                        element.hideRangesForChallenge.start = element.hideRangesForChallenge.end;
                    else
                        element.hideRangesForChallenge.start = pos;
                }
            }
            return {story: story};
        });
    }

    wrong() {
        playSoundWrong();
    }

    right() {
        playSoundRight();
        this.setState({right: true, blocked: false});
    }

    block_next() {
        this.setState({blocked: true});
    }

    setSpacer() {
        if(!document.getElementById("story")) return
        let parts = document.getElementById("story").querySelectorAll("div.part:not(.hidden)")
        let last = parts[parts.length-1];
        let spacer = window.innerHeight/2-last.clientHeight*0.5;

        if(!this.props.editor)
            scroll_down();
        if(spacer !== this.state.spacer)
            this.setState({spacer: spacer});
    }

    componentDidUpdate() {
        this.setSpacer();
    }

    finish() {
        setStoryDone(this.props.story);
        this.props.onQuit();
    }

    render() {
        let story = this.state.story || this.props.story;
        let editor = this.props.editor || false;
        if(this.props.story_json !== undefined)
            story = this.props.story_json;
        if(story === undefined)
            return null;
        var parts = [];
        let last_id = -1;
        for(let element of story.elements) {
            if(element.trackingProperties === undefined) {
                continue;
            }
            if(last_id !== element.trackingProperties.line_index) {
                parts.push([]);
                last_id = element.trackingProperties.line_index;
            }
            parts[parts.length-1].push(element);
        }

        let finished = (this.state.progress === parts.length);

        if(editor)
            return (
                        <div id="story" style={{paddingBottom: "0px"}}>
                            {parts.map((part, i) => (
                                <Part key={i} editor={editor} controls={this.controls} progress={this.state.progress} part={part} />
                            ))}
                        </div>
            );

        return (
            <div>
                <div id="header">
                    <div id="header_icon"><span id="quit" onClick={this.props.onQuit} /></div>
                    <div id="progress">
                        <div id="progress_inside" style={{width: this.state.progress/parts.length*100+"%"}}>
                            <div id="progress_highlight"></div>
                        </div>
                    </div>
                </div>
                <div id="main">
                    <div id="story" style={{paddingBottom: "0px"}}>
                        <div className="legal">
                            This story is owned by Duolingo, Inc. and is used under license from Duolingo.<br/>
                            Duolingo is not responsible for the translation of this story into <span>{this.props.language_data !== undefined ? this.props.language_data[story.learningLanguage].name : ""}</span> and is not an official product of Duolingo.
                            Any further use of this story requires a license from Duolingo.<br/>
                            Visit <a style={{color: "gray"}} href="https://www.duolingo.com">www.duolingo.com</a> for more information.
                        </div>
                        {parts.map((part, i) => (
                            <Part key={i} editor={editor} controls={this.controls} progress={this.state.progress} part={part} />
                        ))}
                    </div>
                    <div style={{height: this.state.spacer+"px"}} />
                    {finished ? <FinishedPage story={story} /> : null
                    }
                </div>
                <div id="footer"
                     data-right={this.state.right ? "true" : undefined}
                >
                    <div id="footer_content">
                        <div id="footer_result">
                            <div>
                                <div id="footer_result_icon"><span/></div>
                                <div id="footer_result_text"><h2>You are correct</h2></div>
                            </div>
                        </div>
                        <div id="footer_buttons">
                            <button id="button_discuss" style={{float: "left", display: "none"}}
                                    className="button">
                                Discussion
                            </button>
                            {finished ?
                                <button id="button_next"
                                        className="button" onClick={() => this.finish()}>finished</button>
                                : <button id="button_next"
                                          data-status={this.state.blocked ? "inactive" : undefined}
                                          className="button" onClick={() => this.next()}>continue</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

function scroll_down() {
    // scroll down to the bottom
    document.documentElement.scrollTo({
        left: 0,
        top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        behavior: 'smooth'
    });
}