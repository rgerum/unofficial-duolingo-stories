import { getUser } from "@/lib/userInterface";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({}) {
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
  if (!user?.role) {
    //redirect("/editor/not_allowed")
  }

  return (
    <p id="no_stories">Click on one of the courses to display its stories.</p>
  );
}
