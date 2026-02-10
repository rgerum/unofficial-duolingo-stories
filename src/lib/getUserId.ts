import { getUser } from "@/lib/userInterface";

export default async function getUserId() {
  const user = await getUser();
  return user?.userId;
}
