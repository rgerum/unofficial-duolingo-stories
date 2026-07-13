import Link from "next/link";
import {
  IconDiscord,
  IconGithub,
  IconInstagram,
  IconOpenCollective,
  IconTwitter,
} from "@/components/icons";
import { IconApple, IconPlayStore } from "@/components/icons";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/store_links";

export default function Icons() {
  return (
    <p className="m-0 mt-[-8px] flex justify-center gap-0 leading-[0.5] [&>a]:p-2">
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
      <Link href={PLAY_STORE_URL}>
        <IconPlayStore />
      </Link>
      <Link href={APP_STORE_URL}>
        <IconApple />
      </Link>
    </p>
  );
}
