import Link from "next/link";
import {
  IconDiscord,
  IconGithub,
  IconInstagram,
  IconOpenCollective,
  IconTwitter,
} from "components/icons";
import styles from "./layout.module.css";
import { IconPlayStore } from "@/components/icons";

export default function Icons() {
  return (
    <p className={styles.icons}>
      <Link href="https://discord.gg/4NGVScARR3">
        <IconDiscord />
      </Link>
      <Link href="https://github.com/rgerum/unofficial-duolingo-stories">
        <IconGithub />
      </Link>
      <Link href="https://opencollective.com/duostories">
        <IconOpenCollective />
      </Link>
      <Link href="https://www.instagram.com/duostoriesproject/">
        <IconInstagram />
      </Link>
      <Link href="https://twitter.com/DuostoriesNews">
        <IconTwitter />
      </Link>
      <Link href="https://play.google.com/store/apps/details?id=org.duostories.twa">
        <IconPlayStore />
      </Link>
    </p>
  );
}
