import React from "react";
import styles from "./DocsSearchModal.module.css";

function DocsSearchModal() {
  return (
    <>
      <div className={styles.blur} id="blur"></div>
      <div className={styles.blur2} id="blur2"></div>
      <div className={styles.search_modal} id="search_modal">
        <div>
          <input
            id="search_input"
            placeholder=" Search Documentation..."
          ></input>
          <button>Esc</button>
        </div>
        <div id="search_results"></div>
      </div>
    </>
  );
}

export default DocsSearchModal;
