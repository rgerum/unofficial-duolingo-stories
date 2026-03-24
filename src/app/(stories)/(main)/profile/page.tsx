import Header from "../header";
import Profile from "./profile";
import { Metadata } from "next";
import { getProfileData } from "./data";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://duostories.org/profile",
  },
};

export default async function Page() {
  const providers = await getProfileData();

  if (providers === undefined) {
    return (
      <Header>
        <p data-cy="profile-error">Not Logged in</p>
        <p>You need to be logged in to see your profile.</p>
      </Header>
    );
  }

  return (
    <>
      <Profile providers={providers} />
    </>
  );
}
