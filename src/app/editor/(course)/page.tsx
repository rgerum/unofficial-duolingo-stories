import { getUser, isContributor } from "@/lib/userInterface";
import { Metadata } from "next";
import Link from "next/link";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({}): Promise<Metadata> {
  return {
    title: `Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/`,
    },
  } as Metadata;
}

export default async function Page({}) {
  const user = await getUser();

  if (!user) {
    //redirect("/editor/login")
  }
  if (!isContributor(user)) {
    //redirect("/editor/not_allowed")
  }

  return (
    <div>
      <p id="no_stories">Click on one of the courses to display its stories.</p>
      <p className="mt-4">
        <Link className="underline" href="/editor/interest">
          ❤️ Courses ranked by learner interest
        </Link>
      </p>
    </div>
  );
}
