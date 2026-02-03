import { sql } from "@/lib/db";
import { getPostHogClient } from "@/lib/posthog-server";

interface UserCheckResult {
  id: number;
  email: string;
}

interface ErrorResult {
  status: number;
  message: string;
}

type CheckUsernameResult = UserCheckResult | ErrorResult | true;

async function check_username(
  name: string,
  existing: boolean,
): Promise<CheckUsernameResult> {
  const result =
    await sql`SELECT id, email FROM "users" WHERE LOWER(name) = LOWER(${name})`;

  if (existing) {
    if (result.length) {
      return result[0] as UserCheckResult;
    }
    return { status: 403, message: "Error username does not exists" };
  } else {
    if (result.length) {
      return { status: 403, message: "Error username already exists" };
    }
    return true;
  }
}

export async function activate({ name, hash }: { name: string; hash: string }) {
  // check username
  const username_check = await check_username(name, true);
  if (typeof username_check === "object" && "status" in username_check)
    return username_check;
  // activate the user
  await sql`UPDATE "users" SET activated = true WHERE name = ${name} AND activation_link = ${hash};`;

  // check if it was set correctly
  let result2 =
    await sql`SELECT activated FROM "users" WHERE name = ${name} AND activation_link = ${hash};`;

  if (result2[0].activated) {
    // Track successful account activation
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: name,
      event: "user_account_activated",
      properties: {
        username: name,
      },
    });
    posthog.identify({
      distinctId: name,
      properties: {
        username: name,
        activated: true,
      },
    });
    return "done";
  }
  return { status: 403, message: "Username or activation link do not exist." };
}
