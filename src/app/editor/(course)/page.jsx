import { auth } from "@/auth";

export async function generateMetadata({}) {
  return {
    title: `Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/`,
    },
  };
}

export default async function Page({}) {
  const session = await auth();

  if (!session) {
    return { redirect: { destination: "/editor/login", permanent: false } };
  }
  if (!session?.user?.role) {
    return {
      redirect: { destination: "/editor/not_allowed", permanent: false },
    };
  }

  return (
    <p id="no_stories">Click on one of the courses to display its stories.</p>
  );
}
