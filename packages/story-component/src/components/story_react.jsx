import React from 'react';
import './story.css';

import {playSoundRight, playSoundWrong} from "./sound_effects";
import {Part} from "./part";
import {FinishedPage} from "./finish_page";
import {setStoryDone, getStoryJSON, scroll_down} from "./includes";


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
                if(element.trackingProperties.line_index === index && element.hideRangesForChallenge !== undefined && element.hideRangesForChallenge.length) {
                    if(pos === undefined)
                        element.hideRangesForChallenge[0].start = element.hideRangesForChallenge[0].end;
                    else
                        element.hideRangesForChallenge[0].start = pos;
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
        setStoryDone(this.props.story_id);
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

        if(editor) {
            return (
                <div id="story" style={{paddingBottom: "0px"}}>
                    {parts.map((part, i) => (
                        <Part key={i} editor={editor} controls={this.controls} progress={this.state.progress}
                              part={part}/>
                    ))}
                </div>
            );
        }

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
                            Duolingo is not responsible for the translation of this story into <span>{/*this.props.language_data !== undefined ? this.props.language_data[story.learningLanguage].name : ""*/}</span> and is not an official product of Duolingo.
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
