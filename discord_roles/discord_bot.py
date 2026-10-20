import asyncio
import discord
import json
import sys
import time
from urllib import error, request
from pathlib import Path
from env_utils import load_env_file

params = Path(__file__).parent / ".env.local"
params = load_env_file(params)

CHANNEL_BOT_LOG = 1133529323396145172
CONVEX_DISCORD_STORIES_ROLE_STATUS_URL = params.get(
    "CONVEX_DISCORD_STORIES_ROLE_STATUS_URL",
    params["CONVEX_DISCORD_SYNC_URL"].replace(
        "/set-contributor-write",
        "/set-stories-role-status",
    ),
)
CONVEX_DISCORD_SYNC_SECRET = params["DISCORD_ROLE_SYNC_SECRET"]


def sync_stories_role_status(snapshots):
    payload = {
        "secret": CONVEX_DISCORD_SYNC_SECRET,
        "snapshots": snapshots,
    }
    req = request.Request(
        CONVEX_DISCORD_STORIES_ROLE_STATUS_URL,
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
            f"convex stories role sync failed: HTTP {err.code}: {details}"
        ) from err
    except Exception as err:
        raise RuntimeError(f"convex stories role sync failed: {err}") from err

    if not isinstance(body, dict) or not body.get("ok"):
        raise RuntimeError(
            f"convex stories role sync returned invalid response: {body}"
        )

    return body


def get_snapshot_row(row, *, sync_status, assigned_stories_count=None, last_error=None):
    milestone_stories = row.get("milestone_stories")
    return {
        "legacyUserId": int(row["legacy_user_id"]),
        "discordAccountId": row.get("discord_account_id"),
        "eligibleStoriesCount": int(milestone_stories)
        if isinstance(milestone_stories, int)
        else None,
        "assignedStoriesCount": assigned_stories_count,
        "syncStatus": sync_status,
        "lastSyncedAt": int(time.time() * 1000),
        "lastError": last_error,
    }


def set_user_roles(sync_rows):
    """Assigns the roles; returns True once the snapshots reached Convex."""
    result = {"synced": False}
    try:
        global params

        # Token of your Discord bot
        TOKEN = params['DISCORD_TOKEN']

        # ID of your server
        GUILD_ID = 726701782075572277

        # ID of the role you want to assign
        ROLE_ID = {
            200: 1129006031868002325,
            120: 1021418996500799518,
             80: 1021418781853098005,
             40: 1021418701158875269,
             20: 1021418386334416978,
              8: 1021417953956208650,
              4: 1021423243627864094,
        }

        # ID of the user you want to assign the role to
        USER_ID = 724679808071761982

        # Create a bot instance
        intents = discord.Intents.default()
        intents.typing = False
        intents.presences = False
        intents.members = False  # Enable the Members intent
        bot = discord.Client(intents=intents)

        async def log(message):
                channel = bot.get_channel(CHANNEL_BOT_LOG)
                await channel.send(message)

        # Returns True when every role was handled and the snapshots reached
        # Convex. Failed role operations are still uploaded (as "error"
        # snapshots) but count as a failed run, so the next tick retries.
        async def assign_roles():
            print(f'Logged in as {bot.user.name}')

            # Fetch the server (guild) from its ID
            guild = bot.get_guild(GUILD_ID)
            if guild is None:
                print('Guild not found')
                return False

            # Fetch the role from its ID
            roles = {k: guild.get_role(v) for k, v in ROLE_ID.items()}
            snapshots = []

            # Fetch the member from their ID
            print(guild.name)
            for row in sync_rows:
                discord_account_id = row.get("discord_account_id")
                target_count = row.get("milestone_stories")
                print("USER_ID", discord_account_id)
                if not discord_account_id:
                    snapshots.append(
                        get_snapshot_row(row, sync_status="not_linked")
                    )
                    continue

                try:
                    member = await guild.fetch_member(int(discord_account_id))
                except discord.errors.NotFound:
                    print("NOT FOUND")
                    snapshots.append(
                        get_snapshot_row(
                            row,
                            sync_status="member_not_found",
                        )
                    )
                    continue
                if member is None:
                    print('Member not found')
                    snapshots.append(
                        get_snapshot_row(
                            row,
                            sync_status="member_not_found",
                        )
                    )
                    continue

                print(member.roles)
                role_max = max([0]+[int(role.name[:-len(" Stories")]) for role in member.roles if "Stories" in role.name])
                should_assign = isinstance(target_count, int) and role_max < target_count
                print("max", role_max, should_assign, target_count, member.roles)
                try:
                    if should_assign:
                        await member.add_roles(roles[target_count])
                        await member.remove_roles(
                            *[role for k, role in roles.items() if k != target_count]
                        )
                        await log(f"🏅 I gave {member.name} the role {roles[target_count].name}. Previous role '{role_max} Stories'")
                        print(f'Role {roles[target_count].name} added to {member.name}')
                        print(f'Roles {[role.name for k, role in roles.items() if k != target_count]} removed from {member.name}')
                        snapshots.append(
                            get_snapshot_row(
                                row,
                                sync_status="assigned",
                                assigned_stories_count=target_count,
                            )
                        )
                    else:
                        # Clean up lower milestone roles left behind, e.g. by
                        # a promotion whose removal step failed earlier.
                        stale_roles = [
                            role
                            for k, role in roles.items()
                            if k < role_max and role in member.roles
                        ]
                        if stale_roles:
                            await member.remove_roles(*stale_roles)
                            print(f'Roles {[role.name for role in stale_roles]} removed from {member.name}')
                        snapshots.append(
                            get_snapshot_row(
                                row,
                                sync_status="up_to_date"
                                if isinstance(target_count, int)
                                else "no_milestone",
                                assigned_stories_count=role_max or None,
                            )
                        )
                except Exception as err:
                    print(err)
                    snapshots.append(
                        get_snapshot_row(
                            row,
                            sync_status="error",
                            assigned_stories_count=role_max or None,
                            last_error=str(err),
                        )
                    )

            if snapshots:
                await asyncio.to_thread(sync_stories_role_status, snapshots)
            return not any(
                snapshot["syncStatus"] == "error" for snapshot in snapshots
            )

        # Event triggered when the bot is ready. discord.py swallows exceptions
        # raised in event handlers, so catch them here and always disconnect:
        # otherwise bot.run() keeps the run alive until RuntimeMaxSec.
        @bot.event
        async def on_ready():
            try:
                result["synced"] = await assign_roles()
            except Exception as err:
                print(f"role sync failed: {err}")
            finally:
                await bot.close()

        # Start the bot
        bot.run(TOKEN)
    except Exception as err:
        print(f"role sync failed: {err}")
    return result["synced"]


if __name__ == "__main__":

    from combine import CACHE_DIR, fetch_change_marker, get_stories_role_sync_rows
    from role_sync_schedule import (
        load_state,
        needs_full_sync,
        record_failed_attempt,
        save_state,
    )

    # Started every 10 minutes by discord-story-count.timer; see
    # role_sync_schedule.py for when a full sync actually runs.
    state_file = CACHE_DIR / "role_sync_state.json"
    started_at = time.time()
    marker = fetch_change_marker()
    run, reason = needs_full_sync(load_state(state_file), marker, started_at)
    if "--force" in sys.argv[1:]:
        run, reason = True, "forced"
    print(f"role sync: {'full sync' if run else 'skipped'} ({reason})")
    if not run:
        sys.exit(0)

    state = load_state(state_file)
    sync_rows = get_stories_role_sync_rows()
    if set_user_roles(sync_rows):
        # Only remember the marker once the sync succeeded, so a failed run is
        # retried (with backoff, see role_sync_schedule.py).
        save_state(state_file, marker=marker, synced_at=started_at)
    else:
        record_failed_attempt(state_file, state, marker=marker, failed_at=started_at)
        sys.exit(1)
