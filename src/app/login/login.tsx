"use client";

export function SignIn(props: { signin_action: (data: FormData) => void }) {
  const { signin_action } = props;
  return (
    <form action={signin_action}>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Username
        <input name="username" type="text" />
      </label>
      <label>
        Password
        <input name="password" type="password" />
      </label>
      <button>Sign In</button>
    </form>
  );
}
