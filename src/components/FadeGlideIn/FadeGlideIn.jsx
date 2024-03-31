import React from "react";
import styles from "./FadeGlideIn.module.css";

function FadeGlideIn({ children, show = true, duration = 400 }) {
  const divRef = React.useRef();
  const [hidden, setHidden] = React.useState(!show);
  React.useEffect(() => {
    if (show && hidden) {
      setHidden(false);
      return;
    }
    if (!show && !hidden) {
      const frames = [
        {
          opacity: 1,
          height: divRef.current.clientHeight + "px",
          clipPath: "polygon(0 100%, 100% 100%, 100% 0, 0 0)",
        },
        {
          opacity: 0,
          height: "0",
          clipPath: "polygon(0 0%, 100% 0%, 100% 0, 0 0)",
        },
      ];
      divRef.current.animate(frames, {
        fill: "both",
        duration: duration,
        iterations: 1,
      });
      const timer = window.setTimeout(() => setHidden(true), duration);
      return () => window.clearTimeout(timer);
    }
  }, [show]);
  if (show)
    return (
      <div ref={divRef} className={styles.fadeGlideIn}>
        {children}
      </div>
    );
  if (hidden) return null;
  return <div ref={divRef}>{children}</div>;
}

export default FadeGlideIn;
