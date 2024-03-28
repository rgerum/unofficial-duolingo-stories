import React from "react";
import styles from "./CheckButton.module.css";

function CheckButton({ type }) {
  const className =
    styles.multiple_choice_checkbox + " " + (!!styles[type] && styles[type]);

  return <button className={className} data-cy="button" />;
}

export default CheckButton;
