import React from "react";
import Link from "next/link";

export default function Legal({ language_name }: { language_name?: string }) {
  return (
    <small className="mt-5 block px-[10px] pb-[10px] text-center text-[0.8em] text-[#666] [direction:ltr] [&_a]:text-[#666]">
      These stories are owned by Duolingo, Inc. and are used under license from
      Duolingo.
      <br />
      Duolingo is not responsible for the translation of these stories{" "}
      <span id="license_language">
        {language_name ? "into " + language_name : ""}
      </span>{" "}
      and this is not an official product of Duolingo.
      <br />
      Any further use of these stories requires a license from Duolingo.
      <br />
      Visit <Link href="https://www.duolingo.com">www.duolingo.com</Link> for
      more information.
    </small>
  );
}
