import Link from "next/link";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/store_links";

// Official store badge artwork lives in public/badges. Google's PNG carries
// built-in transparent padding, so it renders at a larger height than the
// Apple SVG to end up visually the same size.
export default function StoreBadges() {
  return (
    <p className="m-0 flex items-center justify-center gap-1">
      <Link href={APP_STORE_URL}>
        <img
          src="/badges/app-store-badge.svg"
          alt="Download on the App Store"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </Link>
      <Link href={PLAY_STORE_URL}>
        <img
          src="/badges/google-play-badge.png"
          alt="Get it on Google Play"
          width={646}
          height={250}
          className="h-[60px] w-auto"
        />
      </Link>
    </p>
  );
}
