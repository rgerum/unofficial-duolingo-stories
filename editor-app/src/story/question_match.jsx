import React from "react";
import {shuffle} from "./includes";
import {EditorNoHook} from "./editor_hooks";


export class QuestionMatch extends React.Component {
    constructor(props) {
        super(props);
        this.createOrder(props);

        //this.props.controls.block_next();
        window.addEventListener("progress_changed", this.progress_changed.bind(this))

        this.editor = props.element.editor;
        window.addEventListener("editorLineChanged", (e) => this.editorLineChanged(e));
    }

    editorLineChanged(e) {
        let editor = this.editor;
        let should_be_selected = editor && editor.start_no <= e.detail.lineno && e.detail.lineno < editor.end_no;

        if (should_be_selected !== this.state.selected)
            this.setSelected(should_be_selected);
    }

    setSelected(x) {
        this.setState({selected: x});
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
            selected: false,
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
            let right_count = this.state.clicked.map((item, )=>(item === "right")).reduce((a,b)=>a+b, 0);
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

        let onClick;
        [hidden2, onClick] = EditorNoHook(hidden2, props.element.editor, this.state.selected);

        return <div className={"fadeGlideIn "+hidden2} onClick={onClick} lineno={element?.editor?.block_start_no}>
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