import {NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import {query_one_obj} from  "lib/db";


export async function GET(req, {params}) {
    try {
        const {image_id} = params;
        const token = await getToken({ req })

        if(!token?.role)
            return new Response('You need to be a registered contributor.', {status: 401})

        let answer = await get_image({image_id});

        if(answer === undefined)
            return new Response('Error not found.', {status: 404})

        return NextResponse.json(answer);
    }
    catch (err) {
        return new Response(err.message, {status: 500})
    }
}


async function get_image({image_id}) {
    return await query_one_obj(`SELECT * FROM image WHERE id = ?`, [image_id]);
}