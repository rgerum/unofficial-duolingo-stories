import React from "react";
import styles from "./story_footer.module.css";

export default function Footer({
  right,
  finished,
  blocked,
  next,
  finish,
  localization,
}) {
  return (
    <div className={styles.footer} data-right={right ? "true" : undefined}>
      <div className={styles.footer_content}>
        <div className={styles.footer_result}>
          <div>
            <div className={styles.footer_result_icon}>
              <span />
            </div>
            <div className={styles.footer_result_text}>
              <h2>{localization("story_correct")}</h2>
            </div>
          </div>
        </div>
        <div className={styles.footer_buttons}>
          {finished ? (
            <button
              className={styles.button_next + " " + styles.button}
              data-cy={"button-finished"}
              onClick={finish}
            >
              {localization("button_finished")}
            </button>
          ) : (
            <button
              className={styles.button_next + " " + styles.button}
              data-status={blocked ? "inactive" : undefined}
              data-cy={"continue"}
              onClick={blocked ? () => {} : next}
            >
              {localization("button_continue")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
