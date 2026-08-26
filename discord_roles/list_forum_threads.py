#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import ssl
import subprocess
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiohttp

try:
    import discord
except ImportError as err:
    print(
        "discord.py is not installed. Install the dependencies from "
        "discord_roles/requirements.txt first.",
        file=sys.stderr,
    )
    raise SystemExit(1) from err

try:
    import certifi
except ImportError:
    certifi = None

from env_utils import load_env_file


DEFAULT_FORUM_CHANNEL_ID = 1130203140751380571
DEFAULT_ENV_PATH = Path(__file__).parent / ".env.local"


@dataclass
class ThreadSummary:
    id: int
    title: str
    archived: bool
    message_count: int | None
    created_at: str | None
    jump_url: str
    author_id: int | None
    author_name: str | None
    first_message: str
    first_message_body: str


@dataclass
class StoryLinkMatch:
    matchFound: bool
    confidence: str
    storyId: int | None
    courseShort: str | None
    storyTitle: str | None
    editorLine: int | None
    editorLines: list[int]
    editorLink: str | None
    editorLinks: list[str]
    storyLink: str | None
    storyLinks: list[str]
    storyFile: str | None
    issueSummary: str
    evidence: list[str]
    notes: str
    draftMessage: str


@dataclass
class ThreadSummaryWithMatch:
    id: int
    title: str
    archived: bool
    message_count: int | None
    created_at: str | None
    jump_url: str
    author_id: int | None
    author_name: str | None
    first_message: str
    first_message_body: str
    story_match: StoryLinkMatch | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "List Discord forum threads and print their title, first message, "
            "and approximate message count."
        )
    )
    parser.add_argument(
        "--channel-id",
        type=int,
        default=DEFAULT_FORUM_CHANNEL_ID,
        help=f"Forum channel ID to inspect (default: {DEFAULT_FORUM_CHANNEL_ID}).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Maximum number of threads to print unless --all is used.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="List all accessible threads instead of stopping at --limit.",
    )
    parser.add_argument(
        "--active-only",
        action="store_true",
        help="Only list active threads from the gateway cache.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON instead of plain text.",
    )
    parser.add_argument(
        "--resolve-links",
        action="store_true",
        help=(
            "Run the Codex story matcher for each thread and include the resolved "
            "editor link in the output."
        ),
    )
    parser.add_argument(
        "--author-context-limit",
        type=int,
        default=50,
        help=(
            "When resolving links, inspect up to this many newest threads to build "
            "same-author context for ambiguous reports."
        ),
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Optional model name to pass to the Codex story matcher.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_PATH,
        help=f"Path to the env file containing DISCORD_TOKEN (default: {DEFAULT_ENV_PATH}).",
    )
    parser.add_argument(
        "--cafile",
        type=Path,
        default=None,
        help=(
            "Path to a CA bundle to use for HTTPS requests. By default the script "
            "uses certifi when available."
        ),
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable HTTPS certificate verification. Only use this for debugging.",
    )
    argv = [arg for arg in sys.argv[1:] if arg != "--"]
    return parser.parse_args(argv)


def load_token(env_path: Path) -> str:
    if not env_path.exists():
        raise SystemExit(f"Env file not found: {env_path}")

    env = load_env_file(env_path)
    token = env.get("DISCORD_TOKEN")
    if not token:
        raise SystemExit(f"DISCORD_TOKEN is missing in {env_path}")
    for key, value in env.items():
        os.environ.setdefault(key, value)
    return token


def truncate(value: str, limit: int = 400) -> str:
    value = " ".join(value.split())
    if len(value) <= limit:
        return value
    return f"{value[: limit - 3]}..."


def parse_story_match(output: str) -> StoryLinkMatch:
    decoder = json.JSONDecoder()
    last_object: dict[str, Any] | None = None

    for index, char in enumerate(output):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            last_object = value

    if last_object is None:
        raise ValueError("No JSON object found in matcher output.")

    return StoryLinkMatch(
        matchFound=bool(last_object.get("matchFound")),
        confidence=str(last_object.get("confidence") or "low"),
        storyId=(
            int(last_object["storyId"])
            if isinstance(last_object.get("storyId"), int)
            else None
        ),
        courseShort=(
            str(last_object["courseShort"])
            if isinstance(last_object.get("courseShort"), str)
            else None
        ),
        storyTitle=(
            str(last_object["storyTitle"])
            if isinstance(last_object.get("storyTitle"), str)
            else None
        ),
        editorLine=(
            int(last_object["editorLine"])
            if isinstance(last_object.get("editorLine"), int)
            else None
        ),
        editorLines=[
            int(item)
            for item in last_object.get("editorLines", [])
            if isinstance(item, int)
        ],
        editorLink=(
            str(last_object["editorLink"])
            if isinstance(last_object.get("editorLink"), str)
            else None
        ),
        editorLinks=[
            str(item)
            for item in last_object.get("editorLinks", [])
            if isinstance(item, str)
        ],
        storyLink=(
            str(last_object["storyLink"])
            if isinstance(last_object.get("storyLink"), str)
            else None
        ),
        storyLinks=[
            str(item)
            for item in last_object.get("storyLinks", [])
            if isinstance(item, str)
        ],
        storyFile=(
            str(last_object["storyFile"])
            if isinstance(last_object.get("storyFile"), str)
            else None
        ),
        issueSummary=str(last_object.get("issueSummary") or ""),
        evidence=[
            str(item)
            for item in last_object.get("evidence", [])
            if isinstance(item, str)
        ],
        notes=str(last_object.get("notes") or ""),
        draftMessage=str(last_object.get("draftMessage") or ""),
    )


def resolve_story_link(
    summary: ThreadSummary,
    *,
    workdir: Path,
    model: str | None,
    context: str,
) -> StoryLinkMatch | None:
    command = [
        "pnpm",
        "exec",
        "tsx",
        "scripts/find-story-link-with-codex.ts",
        "--title",
        summary.title,
        "--body",
        summary.first_message_body,
    ]
    if context:
        command.extend(["--context", context])
    if model:
        command.extend(["--model", model])

    result = subprocess.run(
        command,
        cwd=str(workdir),
        text=True,
        capture_output=True,
        check=False,
    )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        stdout = result.stdout.strip()
        details = stderr or stdout or f"exit code {result.returncode}"
        print(
            f"Warning: story matcher failed for thread {summary.id}: {details}",
            file=sys.stderr,
        )
        return None

    try:
        return parse_story_match(result.stdout)
    except ValueError as err:
        print(
            f"Warning: could not parse matcher output for thread {summary.id}: {err}",
            file=sys.stderr,
        )
        return None


def build_connector(args: argparse.Namespace) -> aiohttp.TCPConnector:
    if args.insecure:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        return aiohttp.TCPConnector(limit=0, ssl=ssl_context)

    cafile: str | None
    if args.cafile is not None:
        cafile = str(args.cafile)
    elif certifi is not None:
        cafile = certifi.where()
    else:
        cafile = None

    ssl_context = (
        ssl.create_default_context(cafile=cafile)
        if cafile is not None
        else ssl.create_default_context()
    )
    return aiohttp.TCPConnector(limit=0, ssl=ssl_context)


def render_message_summary(message: discord.Message | None) -> str:
    if message is None:
        return ""

    parts: list[str] = []
    if message.content:
        parts.append(message.content)

    if message.attachments:
        attachment_names = [
            attachment.filename for attachment in message.attachments if attachment.filename
        ]
        if attachment_names:
            parts.append(f"[attachments: {', '.join(attachment_names)}]")

    if message.embeds:
        embed_bits: list[str] = []
        for embed in message.embeds:
            title = getattr(embed, "title", None)
            description = getattr(embed, "description", None)
            if title:
                embed_bits.append(title)
            elif description:
                embed_bits.append(description)
        if embed_bits:
            parts.append(f"[embeds: {' | '.join(embed_bits)}]")

    return truncate(" ".join(part for part in parts if part))


def render_message_body(message: discord.Message | None) -> str:
    if message is None:
        return ""

    parts: list[str] = []
    if message.content:
        parts.append(message.content)

    if message.attachments:
        attachment_names = [
            attachment.filename for attachment in message.attachments if attachment.filename
        ]
        if attachment_names:
            parts.append(f"[attachments: {', '.join(attachment_names)}]")

    if message.embeds:
        embed_bits: list[str] = []
        for embed in message.embeds:
            title = getattr(embed, "title", None)
            description = getattr(embed, "description", None)
            if title:
                embed_bits.append(title)
            elif description:
                embed_bits.append(description)
        if embed_bits:
            parts.append(f"[embeds: {' | '.join(embed_bits)}]")

    return " ".join(part for part in parts if part)


async def fetch_first_message(thread: discord.Thread) -> discord.Message | None:
    starter = getattr(thread, "starter_message", None)
    if starter is not None:
        return starter

    try:
        return await thread.fetch_message(thread.id)
    except (discord.NotFound, discord.Forbidden):
        return None
    except discord.HTTPException:
        pass

    try:
        async for message in thread.history(limit=1, oldest_first=True):
            return message
    except (discord.Forbidden, discord.HTTPException):
        return None

    return None


def sort_threads(threads: list[discord.Thread]) -> list[discord.Thread]:
    def sort_key(thread: discord.Thread) -> tuple[datetime, int]:
        created_at = thread.created_at or datetime.fromtimestamp(0, tz=timezone.utc)
        return (created_at, thread.id)

    return sorted(threads, key=sort_key, reverse=True)


async def collect_threads(
    channel: discord.ForumChannel,
    *,
    include_archived: bool,
    limit: int | None,
) -> list[discord.Thread]:
    threads: list[discord.Thread] = []
    seen_ids: set[int] = set()

    for thread in sort_threads(list(channel.threads)):
        if thread.id in seen_ids:
            continue
        seen_ids.add(thread.id)
        threads.append(thread)
        if limit is not None and len(threads) >= limit:
            return threads

    if not include_archived:
        return threads

    remaining = None if limit is None else max(limit - len(threads), 0)
    if remaining == 0:
        return threads

    async for thread in channel.archived_threads(limit=remaining):
        if thread.id in seen_ids:
            continue
        seen_ids.add(thread.id)
        threads.append(thread)
        if limit is not None and len(threads) >= limit:
            break

    return threads


async def build_summaries(threads: list[discord.Thread]) -> list[ThreadSummary]:
    summaries: list[ThreadSummary] = []
    for thread in threads:
        first_message = await fetch_first_message(thread)
        created_at = (
            thread.created_at.astimezone(timezone.utc).isoformat()
            if thread.created_at is not None
            else None
        )
        summaries.append(
            ThreadSummary(
                id=thread.id,
                title=thread.name,
                archived=thread.archived,
                message_count=getattr(thread, "message_count", None),
                created_at=created_at,
                jump_url=thread.jump_url,
                author_id=first_message.author.id if first_message is not None else None,
                author_name=(
                    str(first_message.author) if first_message is not None else None
                ),
                first_message=render_message_summary(first_message),
                first_message_body=render_message_body(first_message),
            )
        )
    return summaries


def build_author_context(
    summary: ThreadSummary,
    summaries: list[ThreadSummary],
    *,
    max_items: int = 5,
) -> str:
    if summary.author_id is None:
        return ""

    prior_reports: list[ThreadSummary] = []
    for candidate in summaries:
        if candidate.id == summary.id or candidate.author_id != summary.author_id:
            continue
        if summary.created_at and candidate.created_at and candidate.created_at >= summary.created_at:
            continue
        prior_reports.append(candidate)

    prior_reports = prior_reports[:max_items]
    if not prior_reports:
        return ""

    lines = [f"Previous story-issues reports by same Discord author {summary.author_name or summary.author_id}:"]
    for report in prior_reports:
        lines.append(
            f"- {report.title}: {report.first_message or '[empty first message]'}"
        )
    return "\n".join(lines)


def add_story_matches(
    summaries: list[ThreadSummary],
    *,
    context_summaries: list[ThreadSummary],
    workdir: Path,
    model: str | None,
) -> list[ThreadSummaryWithMatch]:
    return [
        ThreadSummaryWithMatch(
            id=summary.id,
            title=summary.title,
            archived=summary.archived,
            message_count=summary.message_count,
            created_at=summary.created_at,
            jump_url=summary.jump_url,
            author_id=summary.author_id,
            author_name=summary.author_name,
            first_message=summary.first_message,
            first_message_body=summary.first_message_body,
            story_match=resolve_story_link(
                summary,
                workdir=workdir,
                model=model,
                context=build_author_context(summary, context_summaries),
            ),
        )
        for summary in summaries
    ]


def print_plain(summaries: list[ThreadSummary | ThreadSummaryWithMatch]) -> None:
    def print_field(name: str, value: Any) -> None:
        text = str(value)
        lines = text.splitlines() or [""]
        print(f"   {name}: {lines[0]}")
        for line in lines[1:]:
            print(f"      {line}")

    for index, summary in enumerate(summaries, start=1):
        print(f"{index}. {summary.title}")
        print_field("id", summary.id)
        print_field("archived", summary.archived)
        print_field("message_count", summary.message_count)
        print_field("created_at", summary.created_at)
        print_field("jump_url", summary.jump_url)
        print_field("author", getattr(summary, "author_name", None))
        print_field("first_message", summary.first_message or "[empty]")
        story_match = getattr(summary, "story_match", None)
        if story_match is not None:
            print_field("match_found", story_match.matchFound)
            print_field("confidence", story_match.confidence)
            print_field("story_id", story_match.storyId)
            print_field("course_short", story_match.courseShort)
            print_field("story_title", story_match.storyTitle)
            print_field("editor_line", story_match.editorLine)
            print_field("editor_lines", story_match.editorLines)
            print_field("editor_link", story_match.editorLink)
            print_field("editor_links", story_match.editorLinks)
            print_field("story_link", story_match.storyLink)
            print_field("story_links", story_match.storyLinks)
            print_field("issue_summary", story_match.issueSummary)
            print_field("draft_message", story_match.draftMessage)


class ThreadListerClient(discord.Client):
    def __init__(self, args: argparse.Namespace) -> None:
        intents = discord.Intents.default()
        intents.guilds = True
        super().__init__(intents=intents, connector=build_connector(args))
        self.args = args

    async def on_ready(self) -> None:
        try:
            channel = self.get_channel(self.args.channel_id)
            if channel is None:
                channel = await self.fetch_channel(self.args.channel_id)

            if not isinstance(channel, discord.ForumChannel):
                raise RuntimeError(
                    f"Channel {self.args.channel_id} is not a forum channel: "
                    f"{type(channel).__name__}"
                )

            output_limit = None if self.args.all else max(self.args.limit, 0)
            collect_limit = output_limit
            if self.args.resolve_links and output_limit is not None:
                collect_limit = max(output_limit, max(self.args.author_context_limit, 0))
            threads = await collect_threads(
                channel,
                include_archived=not self.args.active_only,
                limit=collect_limit,
            )
            context_summaries = await build_summaries(threads)
            summaries = (
                context_summaries
                if output_limit is None
                else context_summaries[:output_limit]
            )
            output: list[ThreadSummary | ThreadSummaryWithMatch]
            output = summaries
            if self.args.resolve_links:
                context_limit = max(self.args.author_context_limit, 0)
                matcher_context_summaries = (
                    context_summaries[:context_limit] if context_limit > 0 else []
                )
                output = add_story_matches(
                    summaries,
                    context_summaries=matcher_context_summaries,
                    workdir=Path(__file__).resolve().parent.parent,
                    model=self.args.model,
                )

            if self.args.json:
                print(json.dumps([asdict(summary) for summary in output], indent=2))
            else:
                print_plain(output)
        finally:
            await self.close()

    async def on_error(self, event_method: str, *args: Any, **kwargs: Any) -> None:
        print(f"Discord client error in {event_method}", file=sys.stderr)
        await super().on_error(event_method, *args, **kwargs)


async def main() -> None:
    args = parse_args()
    token = load_token(args.env_file)
    client = ThreadListerClient(args)
    try:
        async with client:
            await client.start(token)
    except aiohttp.ClientConnectorCertificateError as err:
        raise SystemExit(
            "TLS certificate verification failed while connecting to Discord. "
            "Retry with the bundled certifi store or pass --cafile /path/to/cacert.pem. "
            "Use --insecure only for debugging.\n"
            f"Original error: {err}"
        ) from err


if __name__ == "__main__":
    asyncio.run(main())
