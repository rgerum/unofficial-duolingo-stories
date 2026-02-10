import { getUser } from "@/lib/userInterface";

export default async function getUserName() {
  const user = await getUser();
  return user?.name;
}
