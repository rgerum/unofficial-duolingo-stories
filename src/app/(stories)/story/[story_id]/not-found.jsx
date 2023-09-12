import Link from "next/link";
import Header from "../../(main)/header";

export default function NotFound() {
    return (
        <Header>
            <h1>Story Not Found</h1>
            <p>This story does not exist or is not published yet.</p>
            <p>Go back to the <Link href={"/"}>main page</Link>.</p>
        </Header>
    )
}