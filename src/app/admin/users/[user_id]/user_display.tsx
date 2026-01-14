"use client";
import { useState } from "react";
import type { AdminUser } from "./schema";
import {
  setUserActivatedAction,
  setUserWriteAction,
  setUserDeleteAction,
} from "./actions";

export async function setUserActivated(data: {
  id: number;
  activated: 0 | 1 | boolean;
}) {
  return await setUserActivatedAction(data);
}

export async function setUserWrite(data: {
  id: number;
  write: 0 | 1 | boolean;
}) {
  return await setUserWriteAction(data);
}

export async function setUserDelete(data: { id: number }) {
  return await setUserDeleteAction(data);
}

function Activate(props: { user: AdminUser }) {
  let [checked, setChecked] = useState(props.user.activated);

  return (
    <label
      className="switch"
      onClick={async (e) => {
        e.preventDefault();
        let value = await setUserActivated({
          id: props.user.id,
          activated: checked ? 0 : 1,
        });
        if (value !== undefined) setChecked(!checked);
      }}
    >
      <input type="checkbox" checked={checked} readOnly />
      <span className="slider round"></span>
    </label>
  );
}

function Write(props: { user: AdminUser }) {
  let [checked, setChecked] = useState(props.user.role);

  return (
    <label
      className="switch"
      onClick={async (e) => {
        e.preventDefault();
        let value = await setUserWrite({
          id: props.user.id,
          write: checked ? 0 : 1,
        });
        if (value !== undefined) setChecked(!checked);
      }}
    >
      <input type="checkbox" checked={checked} readOnly />
      <span className="slider round"></span>
    </label>
  );
}

export default function UserDisplay({ user }: { user: AdminUser }) {
  const [user_] = useState<AdminUser>(user);

  async function Delete() {
    if (window.confirm("Are you sure you want to delete this user?")) {
      console.log("delete", user_);
      await setUserDelete({ id: user_.id });
    }
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>{user_.name}</h1>
      <p>Email: {user_.email}</p>
      <p>{`${user_.regdate}`}</p>
      <p>
        Activated: <Activate user={user} />
      </p>
      <p>
        Contributor: <Write user={user} />
      </p>
      <p>
        Delete: <button onClick={Delete}>delete</button>
      </p>
    </div>
  );
}
/*
<td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.regdate}</td>
                    <td>{user.count}</td>
                    <td><Activate user={user}/></td>
                    <td><Write user={user}/></td>
 */
