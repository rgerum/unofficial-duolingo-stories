import React from "react";
import styles from "./line_hints.module.css"

import {EditorContext} from "../story";

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

export default function HintLineContent({content, audioRange, hideRangesForChallenge, unhide}) {
    hideRangesForChallenge = hideRangesForChallenge ? hideRangesForChallenge[0] : hideRangesForChallenge;

    if(hideRangesForChallenge) {
        if(unhide === -1)
            hideRangesForChallenge = undefined
        else if(unhide > hideRangesForChallenge.start)
            hideRangesForChallenge = {start: unhide, end: hideRangesForChallenge.end};
    }
    const editor = React.useContext(EditorContext);

    let show_trans = editor?.show_trans;
    //var [show_trans, set_show_trans] = useState(0); //TODO window.editorShowTranslations);
    //useEventListener("editorShowTranslations", (e) => { set_show_trans(e.detail.show); })

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
        let is_hidden = hideRangesForChallenge !== undefined &&
        getOverlap(start, end, hideRangesForChallenge.start, hideRangesForChallenge.end) ? true : undefined
        let style = {}
        //TODO
        //if(is_hidden && window.view)
        //    style.color = "#afafaf";
        if(audioRange < start)
            style.opacity = 0.5;

        return <span className={styles.word}
                     key={start+" "+end}
                     style={style}
                     data-hidden={is_hidden}
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
        let is_hidden = hideRangesForChallenge !== undefined &&
        getOverlap(hint.rangeFrom, hint.rangeTo, hideRangesForChallenge.start, hideRangesForChallenge.end) ? true : undefined

        elements.push(<span key={hint.rangeFrom + " "+hint.rangeTo+1} className={styles.word+" "+(is_hidden ? "" : (show_trans ? styles.tooltip_editor : styles.tooltip))}><span>{addSplitWord(hint.rangeFrom, hint.rangeTo+1)}</span><span className={show_trans ? styles.tooltiptext_editor : styles.tooltiptext}>{content.hints[hint.hintIndex]}</span></span>)
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
