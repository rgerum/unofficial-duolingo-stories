import Header from "../header";
import Link from "@/lib/router";

export default function NotFound() {
  return (
    <Header>
      <h1>Course Not Found</h1>
      <p>This course does not exist or is not published yet.</p>
      <p>
        Go back to the <Link href={"/"}>main page</Link>.
      </p>
    </Header>
  );
}
