import React from "react";
import styles from "./FadeGlideIn.module.css";
import useScrollIntoView from "@/hooks/use-scroll-into-view.hook";

function FadeGlideIn({
  children,
  show = true,
  hidden,
  disableScroll,
}: {
  children: React.ReactNode;
  show?: boolean;
  hidden?: boolean;
  disableScroll?: boolean;
}) {
  const ref = useScrollIntoView(show && !hidden && !disableScroll);

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
