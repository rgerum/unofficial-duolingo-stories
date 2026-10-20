"""Decides when the story-role sync needs a full run.

The systemd timer starts discord_bot.py every 10 minutes. A full sync pages
through every public story in Convex, so most runs only fetch a cheap change
marker (the newest story approval - approvals both count towards the roles
and publish story sets) and exit unless it changed. A daily full sync still
catches the rarer changes the marker misses: admin publish toggles, story
edits that shift authorship, and newly linked Discord accounts.
"""

import json
from pathlib import Path

FULL_SYNC_INTERVAL_SECONDS = 24 * 60 * 60


def load_state(path: Path) -> dict:
    try:
        state = json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return state if isinstance(state, dict) else {}


def save_state(path: Path, *, marker, synced_at: float) -> None:
    path.parent.mkdir(exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps({"marker": marker, "lastFullSyncAt": synced_at}))
    tmp.replace(path)


def needs_full_sync(state: dict, marker, now: float) -> tuple[bool, str]:
    """Returns (run?, reason). A marker of None means it couldn't be fetched."""
    if marker is None:
        return True, "change marker unavailable"
    last_full_sync_at = state.get("lastFullSyncAt")
    if not isinstance(last_full_sync_at, (int, float)):
        return True, "no previous full sync"
    if state.get("marker") != marker:
        return True, "approvals changed"
    if now - last_full_sync_at >= FULL_SYNC_INTERVAL_SECONDS:
        return True, "daily full sync"
    return False, "no changes"
