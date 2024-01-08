"use client";
import { useRouter } from "next/navigation";
import { useInput } from "lib/hooks";

export default function Page({}) {
  let [id, setId] = useInput();
  let router = useRouter();

  async function go() {
    await router.push(`/admin/story/${id}`);
  }
  return (
    <>
      <div>
        Story ID <input value={id} onChange={setId} />{" "}
        <button onClick={go}>Go</button>
      </div>
    </>
  );
}
