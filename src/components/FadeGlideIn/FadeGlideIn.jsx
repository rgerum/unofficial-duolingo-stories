import React, { useEffect } from "react";
import styles from "./FadeGlideIn.module.css";
import { motion } from "framer-motion";

function useScrollIntoView(condition) {
  const ref = React.useRef();

  useEffect(() => {
    if (condition)
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [condition]);
  return ref;
}

function FadeGlideIn({ children, show = true, duration = 400 }, refX) {
  if (!show) return null;
  const ref = useScrollIntoView(show);

  return (
    <motion.div
      ref={ref}
      layout={true}
      initial={{
        opacity: 0,
        transform: "translateY(20px)",
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      animate={{
        opacity: 1,
        transform: "translateY(0px)",
      }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
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

export default React.forwardRef(FadeGlideIn);
