"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page({}) {
  const [id, setId] = useState("");
  const router = useRouter();

  async function go() {
    await router.push(`/admin/story/${id}`);
  }
  return (
    <>
      <div>
        Story ID <input value={id} onChange={(e) => setId(e.target.value)} />{" "}
        <button onClick={go}>Go</button>
      </div>
    </>
  );
}
