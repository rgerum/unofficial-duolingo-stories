import { Metadata } from "next";
import InterestList from "./interest_list";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({}): Promise<Metadata> {
  return {
    title: `Learner Interest | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/interest/`,
    },
  } as Metadata;
}

export default function Page() {
  return <InterestList />;
}
