import Link from "next/link";
import React from "react";
import { requireAdmin } from "@/lib/userInterface";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";

function AdminButton({
  children,
  href,
  ...delegated
}: {
  children: React.ReactNode;
  href: string;
} & React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      className="text-[var(--text-color-dim)] px-3.5 cursor-pointer items-center flex flex-row min-w-[105px] no-underline hover:brightness-75 hover:contrast-[2.5] hover:text-[var(--text-color)] max-[1120px]:flex-col max-[1120px]:min-w-0 max-[1120px]:w-auto max-[1120px]:px-2 max-[760px]:flex-row max-[760px]:px-2.5 max-[760px]:min-w-fit"
      href={href}
      {...delegated}
    >
      <div>
        <img
          alt="import button"
          src="/editor/icons/import.svg"
          className="mr-2.5 w-9 max-[1120px]:mr-0 max-[760px]:hidden"
        />
      </div>
      <span>{children}</span>
    </Link>
  );
}

export default async function AdminHeader() {
  await requireAdmin();

  return (
    <nav className="box-border w-full h-[60px] border-b-2 border-[var(--header-border)] bg-[var(--body-background)] flex flex-row items-center sticky px-5 top-0 z-[200] max-w-[100vw] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&>*]:flex-none max-[1120px]:px-3 max-[760px]:h-auto max-[760px]:min-h-[56px] max-[760px]:py-2 max-[760px]:gap-1">
      <b className="pr-2.5 max-[1120px]:hidden">Admin Interface</b>
      <AdminButton href="/admin/users">Users</AdminButton>
      <AdminButton href="/admin/languages">Languages</AdminButton>
      <AdminButton href="/admin/courses">Courses</AdminButton>
      <AdminButton href="/admin/story">Story</AdminButton>

      <div className="ml-auto"></div>
      <LoggedInButtonWrappedClient page={"admin"} />
    </nav>
  );
}
