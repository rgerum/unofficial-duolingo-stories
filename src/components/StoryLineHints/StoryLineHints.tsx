import React, { CSSProperties } from "react";
import styles from "./StoryLineHints.module.css";

//import { EditorContext } from "../story";

function splitTextTokens(text: string, keep_tilde = true) {
  if (!text) return [];
  if (keep_tilde)
    //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/);
  //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
  else return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}~]+)/);
}

function Tooltip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  function onMouseEnter() {
    if (!ref.current) return;
    let tooltipElement = ref.current.children[1] as HTMLElement;

    // Calculate the position of the tooltip
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let offset = 0;
    if (tooltipElement.style.left.split(" ").length >= 2) {
      offset = parseInt(
        tooltipElement.style.left.split(" ")[2].split("px)")[0],
      );
    }
    // Check if the tooltip would be cut off on the right
    if (tooltipRect.right + offset > window.innerWidth) {
      tooltipElement.style.left = `calc(50% + ${
        window.innerWidth - tooltipRect.right - offset
      }px)`;
    }
    // check if the tooltip would be cuf off on the left
    else if (tooltipRect.left - offset < 0) {
      tooltipElement.style.left = `calc(50% + ${-tooltipRect.left + offset}px)`;
    } else {
      tooltipElement.style.left = `50%`;
    }
  }
  return (
    <span onMouseEnter={onMouseEnter} ref={ref} className={className}>
      {children}
    </span>
  );
}

function StoryLineHints({
  content,
  audioRange,
  hideRangesForChallenge,
  unhide,
}: {
  content: {
    text: string;
    hintMap: { rangeFrom: number; rangeTo: number; hintIndex: number }[];
    hints: string[];
    lang_hints?: string;
  };
  audioRange?: number;
  hideRangesForChallenge?: { start: number; end: number }[];
  unhide?: number;
}) {
  if (!content) return <>Empty</>;
  let hideRangesForChallengeEntry = hideRangesForChallenge
    ? hideRangesForChallenge[0]
    : hideRangesForChallenge;

  if (hideRangesForChallengeEntry) {
    if (unhide === -1) hideRangesForChallengeEntry = undefined;
    else if (unhide > hideRangesForChallengeEntry.start)
      hideRangesForChallengeEntry = {
        start: unhide,
        end: Math.max(hideRangesForChallengeEntry.end, unhide),
      };
  }
  const editor = null; // React.useContext(EditorContext);

  let show_trans = undefined; // editor?.show_trans;
  //var [show_trans, set_show_trans] = useState(0); //TODO window.editorShowTranslations);
  //useEventListener("editorShowTranslations", (e) => { set_show_trans(e.detail.show); })

  function getOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ) {
    if (start2 === end2) return false;
    if (start2 === undefined || end2 === undefined) return false;
    if (start1 <= start2 && start2 < end1) return true;
    return start2 <= start1 && start1 < end2;
  }

  function addWord2(start: number, end: number) {
    let is_hidden: boolean | undefined | "editor" =
      hideRangesForChallengeEntry !== undefined &&
      getOverlap(
        start,
        end,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (is_hidden && editor) is_hidden = "editor";
    let style: CSSProperties = {};
    //TODO
    //if(is_hidden && window.view)
    //    style.color = "#afafaf";
    if (audioRange < start) style.opacity = 0.5;

    let returns = [
      <span
        className={styles.word}
        key={start + " " + end}
        style={style}
        data-hidden={is_hidden}
      >
        {content.text.substring(start, end)}
      </span>,
    ];
    if (content.text.substring(start, end).indexOf("\n") !== -1)
      returns.push(<br key={start + " " + end + " br"} />);
    // add the span and optionally add a line break
    return returns;
  }

  function addSplitWord(start: number, end: number) {
    let parts = splitTextTokens(content.text.substring(start, end));
    if (parts[0] === "") parts.splice(0, 1);
    if (parts[parts.length - 1] === "") parts.pop();

    if (parts.length === 1) {
      return addWord2(start, end);
      //addWord(dom, start, end);
      //return dom;
    }
    let elements = [];
    for (let p of parts) {
      for (let w of addWord2(start, start + p.length)) elements.push(w);
      start += p.length;
    }
    // <span className="word">{content.text.substring(text_pos, hint.rangeFrom)}</span>
    return elements;
  }

  let elements = [];
  let text_pos = 0;
  // iterate over all hints
  for (let hint of content.hintMap) {
    // add the text since the last hint
    if (hint.rangeFrom > text_pos)
      elements.push(addSplitWord(text_pos, hint.rangeFrom));
    //addSplitWord(dom.append("span").attr("class", "word"), text_pos, hint.rangeFrom);

    // add the text with the hint
    let is_hidden =
      hideRangesForChallengeEntry !== undefined &&
      getOverlap(
        hint.rangeFrom,
        hint.rangeTo,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (editor) is_hidden = false;

    elements.push(
      <Tooltip
        key={hint.rangeFrom + " " + hint.rangeTo + 1}
        className={
          styles.word +
          " " +
          (is_hidden ? "" : show_trans ? styles.tooltip_editor : styles.tooltip)
        }
      >
        <span>{addSplitWord(hint.rangeFrom, hint.rangeTo + 1)}</span>
        <span
          className={
            (show_trans ? styles.tooltiptext_editor : styles.tooltiptext) +
            " " +
            content.lang_hints
          }
        >
          {content.hints[hint.hintIndex]}
        </span>
      </Tooltip>,
    );
    //addSplitWord(dom.append("span").attr("class", "word tooltip"), hint.rangeFrom, hint.rangeTo+1)
    //    .append("span").attr("class", "tooltiptext").text(content.hints[hint.hintIndex]);
    // advance the position
    text_pos = hint.rangeTo + 1;
  }
  // add the text after the last hint
  if (text_pos < content.text.length)
    elements.push(addSplitWord(text_pos, content.text.length));
  //            addSplitWord(dom.append("span").attr("class", "word"), text_pos, content.text.length);

  return elements;
}
export default StoryLineHints;
