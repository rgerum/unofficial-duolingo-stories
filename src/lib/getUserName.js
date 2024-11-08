import { auth } from "@/auth";

export default async function getUserName() {
  const session = await auth();
  return session?.user?.name;
}
