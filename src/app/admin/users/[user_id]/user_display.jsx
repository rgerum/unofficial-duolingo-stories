"use client";
import { fetch_post } from "@/lib/fetch_post";
import { useState } from "react";

export async function setUserActivated(data) {
  let res = await fetch_post(`/admin/users/set/activate`, data);
  res = await res.text();
  return res;
}

export async function setUserWrite(data) {
  let res = await fetch_post(`/admin/users/set/write`, data);
  res = await res.text();
  return res;
}

function Activate(props) {
  let [checked, setChecked] = useState(props.user.activated);
  async function OnClick(e) {
    e.preventDefault();
    let value = await setUserActivated({
      id: props.user.id,
      activated: checked ? 0 : 1,
    });
    if (value !== undefined) setChecked(checked ? 0 : 1);
  }
  return (
    <label className="switch" onClick={OnClick}>
      <input type="checkbox" checked={checked} readOnly />
      <span className="slider round"></span>
    </label>
  );
}

function Write(props) {
  let [checked, setChecked] = useState(props.user.role);
  async function OnClick(e) {
    e.preventDefault();
    let value = await setUserWrite({
      id: props.user.id,
      write: checked ? 0 : 1,
    });
    if (value !== undefined) setChecked(checked ? 0 : 1);
  }
  return (
    <label className="switch" onClick={OnClick}>
      <input type="checkbox" checked={checked} readOnly />
      <span className="slider round"></span>
    </label>
  );
}

export default function UserDisplay({ user }) {
  const [user_] = useState(user);

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
