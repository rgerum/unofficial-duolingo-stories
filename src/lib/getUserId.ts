import { getUser } from "@/lib/userInterface";

export default async function getUserId() {
  const user = await getUser();
  if (user?.userId) {
    const parsed = Number.parseInt(user.userId, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}
