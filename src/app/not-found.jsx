import Header from "./(stories)/(main)/header";
import Link from "next/link";

export default function NotFound() {
    return (
        <Header>
            <h1>Page Not Found</h1>
            <p>This Page does not exist.</p>
            <p>Go back to the <Link href={"/"}>main page</Link>.</p>
        </Header>
    )
}