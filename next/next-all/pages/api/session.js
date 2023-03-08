import { unstable_getServerSession } from "next-auth/next"
import { authOptions } from "./auth/[...nextauth]"
import { getToken } from "next-auth/jwt"

let a = async (req, res) => {
    const session = await unstable_getServerSession(req, res, authOptions)
    if (session) {
        // Signed in
        console.log("Session", JSON.stringify(session, null, 2))
        res.status(200).json(session)
    } else {
        // Not Signed in
        res.status(401)
    }
    res.end()
}

export default async (req, res) => {
    // If you don't have NEXTAUTH_SECRET set, you will have to pass your secret as `secret` to `getToken`
    const token = await getToken({ req })
    const session = await unstable_getServerSession(req, res, authOptions)
    res.status(200).json({token: token, session: session})
    res.end();
    return
    if (token) {
        // Signed in
        console.log("JSON Web Token", JSON.stringify(token, null, 2))
        res.status(200).json(token)
    } else {
        // Not Signed in
        res.status(401)
    }
    res.end()
}