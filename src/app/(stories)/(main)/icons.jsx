import Link from "next/link";
import {
  IconDiscord,
  IconGithub,
  IconInstagram,
  IconOpenCollective,
  IconTwitter,
} from "components/icons";

export default function Icons() {
  return (
    <p>
      <Link href="https://discord.gg/4NGVScARR3">
        <IconDiscord />
      </Link>
      &nbsp;&nbsp;
      <Link href="https://github.com/rgerum/unofficial-duolingo-stories">
        <IconGithub />
      </Link>
      &nbsp;&nbsp;
      <Link href="https://opencollective.com/duostories">
        <IconOpenCollective />
      </Link>
      &nbsp;&nbsp;
      <Link href="https://www.instagram.com/duostoriesproject/">
        <IconInstagram />
      </Link>
      &nbsp;&nbsp;
      <Link href="https://twitter.com/DuostoriesNews">
        <IconTwitter />
      </Link>
    </p>
  );
}
