import styles from "./question_prompt.module.css"

import HintLineContent from "../text_lines/line_hints";


export default function QuestionPrompt({question}) {
    if(typeof question === "string")
        return <span className={styles.question}>{question}</span>
    return <div className={styles.question}>
        <HintLineContent content={question} />
    </div>
}