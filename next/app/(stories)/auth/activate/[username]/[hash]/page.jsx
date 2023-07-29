import React from "react";
import Link from "next/link";
import {activate} from "./activate";


export default async function Page({params}) {
    let activated = await activate(params);

    return <>
        <div id="login_dialog">
            <div>
                <h2>Activate account</h2>
                {activated === 0 ?
                    <p id="status">activating account...</p>
                    : activated === "done" ?
                        <>
                            <p id="status">Activation successful.</p>
                            <p id="login_form">
                                {/* Use of absolute link because relative links would only be relative to carex.uber.space */}
                                You can now <Link href='/api/auth/signin'>log in</Link>.
                            </p>
                        </>
                        :
                        <p id="status">Activation not successful.</p>
                }
            </div>
        </div>
    </>
}
