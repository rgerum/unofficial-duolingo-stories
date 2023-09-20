import { Spinner } from "components/layout/spinner";

import styles from "./layout.module.css";

/*
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

 */

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <>
      <div className={styles.loading}>
        <p>Loading...</p>
        <Spinner />
      </div>
    </>
  );
}
