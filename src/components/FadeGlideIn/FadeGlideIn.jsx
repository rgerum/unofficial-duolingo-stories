import React from "react";
import styles from "./FadeGlideIn.module.css";
import useScrollIntoView from "@/hooks/use-scroll-into-view.hook";

function FadeGlideIn({ children, show = true, hidden }) {
  const ref = useScrollIntoView(show && !hidden);

  return (
    <div
      className={styles.fadeGlideIn}
      data-show={show}
      data-hidden={hidden}
      ref={ref}
    >
      {children}
    </div>
  );
}

export default FadeGlideIn;
