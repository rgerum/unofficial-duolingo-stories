import { getUser } from "@/lib/userInterface";

export async function generateMetadata({}) {
  return {
    title: `Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/`,
    },
  };
}

export default async function Page({}) {
  const user = await getUser();

  if (!user) {
    return { redirect: { destination: "/editor/login", permanent: false } };
  }
  if (!user?.role) {
    return {
      redirect: { destination: "/editor/not_allowed", permanent: false },
    };
  }

  return (
    <p id="no_stories">Click on one of the courses to display its stories.</p>
  );
}
