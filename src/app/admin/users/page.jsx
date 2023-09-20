"use client";
import { useRouter } from "next/navigation";
import { useInput } from "lib/hooks";

export default function Page({}) {
  let [id, setId] = useInput();
  let router = useRouter();

  async function go() {
    await router.push(`/admin/users/${id}`);
  }
  return (
    <>
      <div>
        User ID or username <input value={id} onChange={setId} />{" "}
        <button onClick={go}>Go</button>
      </div>
    </>
  );
}
