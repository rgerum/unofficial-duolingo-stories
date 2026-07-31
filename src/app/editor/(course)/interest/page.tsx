import { Metadata } from "next";
import InterestList from "./interest_list";

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
