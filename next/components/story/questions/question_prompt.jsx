import styles from "./question_prompt.module.css"

import HintLineContent from "../text_lines/line_hints";


export default function QuestionPrompt({question, lang}) {
    if(typeof question === "string")
        return <span className={styles.question+" "+lang}>{question}</span>
    return <div className={styles.question+" "+lang}>
        <HintLineContent content={question} />
    </div>
}