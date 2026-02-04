export async function fetch_post(
  url: string,
  data: unknown,
): Promise<Response> {
  // check if the user is logged in
  let req = new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    mode: "cors",
    credentials: "include",
  });
  return fetch(req);
}
