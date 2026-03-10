import json
from pathlib import Path
from urllib import error, request

import pandas as pd
from env_utils import load_env_file


params = load_env_file(Path(__file__).parent / ".env.local")
CONVEX_DISCORD_COMBINE_URL = params["CONVEX_DISCORD_COMBINE_URL"]
DISCORD_ROLE_SYNC_SECRET = params["DISCORD_ROLE_SYNC_SECRET"]
CACHE_DIR = Path(__file__).parent / ".cache"
APPROVAL_CACHE_FILE = CACHE_DIR / "approvals_cache.csv"
APPROVAL_CACHE_COLUMNS = ["approval_id", "legacy_user_id", "story_id", "date"]
_contributor_users_cache = None
_public_story_ids_cache = None


def fetch_combine_resource(kind, *, cursor=None, num_items=200, since_date=None):
    payload = {
        "secret": DISCORD_ROLE_SYNC_SECRET,
        "kind": kind,
        "numItems": num_items,
    }
    if cursor is not None:
        payload["cursor"] = cursor
    if since_date is not None:
        payload["sinceDate"] = int(since_date)

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

    return body


def fetch_contributor_users():
    global _contributor_users_cache
    if isinstance(_contributor_users_cache, list):
        return _contributor_users_cache

    data = fetch_combine_resource("users")
    rows = data.get("users", [])
    users = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        legacy_user_id = row.get("legacyUserId")
        author = row.get("author")
        discord_account_id = row.get("discordAccountId")
        if not isinstance(legacy_user_id, int):
            continue
        if not isinstance(author, str):
            continue
        users.append(
            {
                "legacy_user_id": legacy_user_id,
                "author": author,
                "discord_account_id": discord_account_id
                if isinstance(discord_account_id, str)
                else None,
            }
        )

    _contributor_users_cache = users
    return _contributor_users_cache


def fetch_public_story_ids():
    global _public_story_ids_cache
    if isinstance(_public_story_ids_cache, set):
        return _public_story_ids_cache

    story_ids = set()
    cursor = None
    while True:
        data = fetch_combine_resource("publicStories", cursor=cursor)
        for story_id in data.get("page", []):
            if isinstance(story_id, int):
                story_ids.add(story_id)

        if data.get("isDone"):
            break

        cursor = data.get("continueCursor")
        if not isinstance(cursor, str) or cursor == "":
            break

    _public_story_ids_cache = story_ids
    return _public_story_ids_cache


def load_approval_cache():
    CACHE_DIR.mkdir(exist_ok=True)
    if not APPROVAL_CACHE_FILE.exists():
        return pd.DataFrame(columns=APPROVAL_CACHE_COLUMNS)

    data = pd.read_csv(
        APPROVAL_CACHE_FILE,
        dtype={
            "approval_id": "string",
            "legacy_user_id": "Int64",
            "story_id": "Int64",
            "date": "Int64",
        },
    )
    for column in APPROVAL_CACHE_COLUMNS:
        if column not in data.columns:
            data[column] = pd.Series(dtype="object")
    return data[APPROVAL_CACHE_COLUMNS]


def save_approval_cache(data):
    CACHE_DIR.mkdir(exist_ok=True)
    normalized = data.copy()
    if normalized.empty:
        normalized = pd.DataFrame(columns=APPROVAL_CACHE_COLUMNS)
    else:
        normalized = normalized.sort_values(["date", "approval_id"]).reset_index(
            drop=True
        )
    normalized.to_csv(APPROVAL_CACHE_FILE, index=False)


def update_approval_cache():
    cache = load_approval_cache()
    existing_ids = set(cache["approval_id"].dropna().astype(str))
    since_date = None
    if not cache.empty:
        since_date = int(cache["date"].dropna().max())

    new_rows = []
    cursor = None
    while True:
        data = fetch_combine_resource(
            "approvals",
            cursor=cursor,
            since_date=since_date,
        )

        for row in data.get("page", []):
            if not isinstance(row, dict):
                continue

            approval_id = row.get("id")
            legacy_user_id = row.get("legacyUserId")
            story_id = row.get("storyId")
            date = row.get("date")

            if not isinstance(approval_id, str):
                continue
            if approval_id in existing_ids:
                continue
            if not isinstance(legacy_user_id, int) or not isinstance(story_id, int):
                continue
            if not isinstance(date, int):
                continue

            existing_ids.add(approval_id)
            new_rows.append(
                {
                    "approval_id": approval_id,
                    "legacy_user_id": legacy_user_id,
                    "story_id": story_id,
                    "date": date,
                }
            )

        if data.get("isDone"):
            break

        cursor = data.get("continueCursor")
        if not isinstance(cursor, str) or cursor == "":
            break

    if new_rows:
        cache = pd.concat([cache, pd.DataFrame(new_rows)], ignore_index=True)
        save_approval_cache(cache)

    return cache


def get_user_to_discord_mapping():
    user_discord_id = {}
    for user in fetch_contributor_users():
        if isinstance(user["discord_account_id"], str):
            user_discord_id[user["author"]] = user["discord_account_id"]
    return user_discord_id


def get_user_approval_count():
    contributor_users = fetch_contributor_users()
    author_by_legacy_user_id = {
        user["legacy_user_id"]: user["author"] for user in contributor_users
    }
    public_story_ids = fetch_public_story_ids()
    approvals = update_approval_cache()
    if approvals.empty:
        return pd.DataFrame(columns=["author", "story_id", "approval", "public"])

    approvals = approvals.dropna(
        subset=["approval_id", "legacy_user_id", "story_id", "date"]
    ).copy()
    approvals["legacy_user_id"] = approvals["legacy_user_id"].astype(int)
    approvals["story_id"] = approvals["story_id"].astype(int)
    approvals["date"] = approvals["date"].astype(int)
    approvals["author"] = approvals["legacy_user_id"].map(author_by_legacy_user_id)

    approvals = approvals.dropna(subset=["author"])
    approvals = approvals[approvals["story_id"].isin(public_story_ids)]
    approvals = approvals.sort_values(["story_id", "date", "approval_id"])

    # The cache is append-only, so revokes/re-approvals can duplicate a user/story
    # pair over time. Keep the earliest approval we have seen for milestone credit.
    approvals = approvals.drop_duplicates(
        subset=["story_id", "legacy_user_id"],
        keep="first",
    )
    approvals["approval_rank"] = approvals.groupby("story_id").cumcount() + 1
    approvals = approvals[approvals["approval_rank"] <= 2]
    approvals["approval"] = 1
    approvals["public"] = 1

    return approvals[["author", "story_id", "approval", "public"]]


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
    user_roles = []
    for row in get_stories_role_sync_rows():
        if row["milestone_stories"] is None or not row["discord_account_id"]:
            continue
        user_roles.append([row["discord_account_id"], row["milestone_stories"]])
    return user_roles


def get_stories_role_sync_rows():
    data, data0 = join_and_group_data()
    milestones = [4, 8, 20, 40, 80, 120]
    milestone_by_author = {}
    for author, row in data.iterrows():
        story_count = int(row.number)
        milestone = None
        for candidate in milestones[::-1]:
            if story_count >= candidate:
                milestone = candidate
                break
        milestone_by_author[author] = milestone

    rows = []
    for user in fetch_contributor_users():
        milestone = milestone_by_author.get(user["author"])
        rows.append(
            {
                "legacy_user_id": user["legacy_user_id"],
                "author": user["author"],
                "discord_account_id": user["discord_account_id"],
                "milestone_stories": milestone,
            }
        )

    return rows


def get_milestone_grouped_debug_missing_links():
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
