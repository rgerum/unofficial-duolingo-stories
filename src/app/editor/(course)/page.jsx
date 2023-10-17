import { getServerSession } from "next-auth/next";
import { authOptions } from "app/api/auth/[...nextauth]/route";

export async function generateMetadata({}) {
  return {
    title: `Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/`,
    },
  };
}

export default async function Page({}) {
  const session = await getServerSession(authOptions);

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
