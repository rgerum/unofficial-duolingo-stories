import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getServerSession } from "next-auth/next";

export default async function getUserName() {
  const session = await getServerSession(authOptions);
  return session?.user?.name;
}
