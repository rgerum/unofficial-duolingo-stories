import json
from pathlib import Path
from urllib import error, request

import pandas as pd


def parse_env_file(path):
    values = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


params = parse_env_file(Path(__file__).parent / ".env.local")
CONVEX_DISCORD_COMBINE_URL = params["CONVEX_DISCORD_COMBINE_URL"]
DISCORD_ROLE_SYNC_SECRET = params["DISCORD_ROLE_SYNC_SECRET"]
_combine_data_cache = None


def fetch_combine_data():
    global _combine_data_cache
    if isinstance(_combine_data_cache, dict):
        return _combine_data_cache

    payload = {"secret": DISCORD_ROLE_SYNC_SECRET}
    req = request.Request(
        CONVEX_DISCORD_COMBINE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as err:
        details = err.read().decode("utf-8")
        raise RuntimeError(
            f"convex combine data failed: HTTP {err.code}: {details}"
        ) from err
    except Exception as err:
        raise RuntimeError(f"convex combine data failed: {err}") from err

    if not isinstance(body, dict) or not body.get("ok"):
        raise RuntimeError(f"convex combine data returned invalid response: {body}")

    _combine_data_cache = body
    return _combine_data_cache


def get_user_to_discord_mapping():
    data = fetch_combine_data()
    mapping = data.get("user_to_discord_mapping", {})
    if not isinstance(mapping, dict):
        return {}
    return {
        str(k): str(v)
        for k, v in mapping.items()
        if isinstance(k, str) and isinstance(v, str)
    }


def get_user_approval_count():
    data = fetch_combine_data()
    approvals = data.get("approvals", [])
    if not isinstance(approvals, list):
        approvals = []

    rows = []
    for row in approvals:
        if not isinstance(row, dict):
            continue
        author = row.get("author")
        story_id = row.get("story_id")
        approval_date = row.get("date")
        public = row.get("public")
        if not isinstance(author, str):
            continue
        if not isinstance(story_id, int) or not isinstance(approval_date, int):
            continue
        public_int = 1 if bool(public) else 0
        rows.append(
            {
                "author": author,
                "story_id": story_id,
                "date": approval_date,
                "approval": 1,
                "public": public_int,
            }
        )

    return pd.DataFrame(rows)


def join_and_group_data():
    from blame import update_output_csv

    update_output_csv()
    data = pd.read_csv("output.csv")
    data["story_id"] = [int(str(file).split("/")[1][:-4]) for file in data["filename"]]

    data0 = data
    data = data[data.percentage >= 0.1]
    data = data[data.lines >= 3]

    data = pd.concat([get_user_approval_count(), data])

    data = data.sort_values("story_id", ascending=False)
    data = data.groupby(["story_id", "author"]).max(
        ["number", "story_id", "percentage", "lines"]
    )
    data = data.reset_index().sort_values("story_id", ascending=False)

    data = data[data.public == 1]
    print(data)
    data.to_csv("joined.csv")
    data = data.groupby("author").max().sort_values("number", ascending=False)
    return data, data0


def get_milestone_grouped():
    data, data0 = join_and_group_data()
    milestones = [4, 8, 20, 40, 80, 120]

    user_discord_id = get_user_to_discord_mapping()
    user_roles = []
    for mile in milestones[::-1]:
        print("----", mile, "stories", "----")
        d = data[data.number >= mile]
        for i, author in d.iterrows():
            print(
                i,
                author.number,
                f"({len(data0[data0.author == i])})",
                user_discord_id.get(i, "none"),
            )
            if user_discord_id.get(i, None):
                user_roles.append([user_discord_id.get(i), mile])
        data = data[data.number < mile]
    print(user_roles)
    return user_roles


def get_milestone_grouped2():
    data, data0 = join_and_group_data()
    milestones = [4, 8, 20, 40, 80, 120]

    user_discord_id = get_user_to_discord_mapping()
    user_roles = []
    for mile in milestones[::-1]:
        print("----", mile, "stories", "----")
        d = data[data.number >= mile]
        for i, author in d.iterrows():
            print(
                i,
                author.number,
                f"({len(data0[data0.author == i])})",
                user_discord_id.get(i, "none"),
            )
            if not user_discord_id.get(i, None):
                user_roles.append([i, mile])
        data = data[data.number < mile]
    print(user_roles)
    return user_roles


if __name__ == "__main__":
    get_milestone_grouped()
