"use client";
import React from "react";
import Link from "next/link";

export default function Page() {
  return (
    <ul>
      <li>
        <Link href={"/lessons/1"}>Lesson 1</Link>
      </li>
      <li>
        <Link href={"/lessons/explanation"}>Explanation 1</Link>
      </li>
    </ul>
  );
}
