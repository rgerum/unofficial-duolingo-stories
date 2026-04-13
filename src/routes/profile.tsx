import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import MainLayout from "@/app/(stories)/(main)/layout";
import Header from "@/app/(stories)/(main)/header";
import Profile from "@/app/(stories)/(main)/profile/profile";
import { getProfileData } from "@/app/(stories)/(main)/profile/data";

const loadProfile = createServerFn({ method: "GET" }).handler(async () => {
  return getProfileData();
});

export const Route = createFileRoute("/profile")({
  loader: () => loadProfile(),
  component: ProfileRoute,
});

function ProfileRoute() {
  const providers = Route.useLoaderData();

  return (
    <MainLayout>
      {providers ? (
        <Profile providers={providers} />
      ) : (
        <Header>
          <p data-cy="profile-error">Not Logged in</p>
          <p>You need to be logged in to see your profile.</p>
        </Header>
      )}
    </MainLayout>
  );
}
