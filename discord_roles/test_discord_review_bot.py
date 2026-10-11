import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import discord

with patch("pathlib.Path.read_text", return_value=""):
    from discord_review_bot import (
        ROLE_CONTRIBUTOR,
        ROLE_MODERATOR,
        ReviewClient,
        build_ai_prompt,
        format_story_for_ai_review,
    )


class AiReviewPromptTest(unittest.TestCase):
    def test_expands_translation_hints_into_explicit_token_pairs(self):
        story = """[LINE]
> Sārih kimaka sē kāxah Līlih.
~ Zari le~da~a una caja Lily"""

        self.assertEqual(
            format_story_for_ai_review(story),
            """[LINE]
> Sārih kimaka sē kāxah Līlih.
Sārih = Zari
kimaka = le~da~a
sē = una
kāxah = caja
Līlih. = Lily""",
        )

    def test_prompt_explains_that_hints_are_literal_glosses(self):
        prompt = build_ai_prompt(
            {
                "storyId": 1,
                "name": "Test",
                "courseShort": "nhe-es",
                "learningLanguage": "nhe",
                "text": "> nicān\n~ aquí",
            }
        )

        self.assertIn("deliberately literal, sentence-specific glosses", prompt)
        self.assertIn("nicān = aquí", prompt)

    def test_preserves_hint_line_when_it_cannot_be_safely_aligned(self):
        story = "> two words\n~ one"

        self.assertEqual(format_story_for_ai_review(story), story)

    def test_audio_course_omits_no_audio_checklist(self):
        prompt = build_ai_prompt(
            {
                "storyId": 9730,
                "name": "¿Gracias?",
                "courseShort": "nah-es",
                "learningLanguage": "nah",
                "noAudio": False,
                "text": "[ARRANGE]\n> Escucha y selecciona las palabras",
            }
        )

        self.assertIn("This course has audio", prompt)
        self.assertIn("Do not flag listening challenges", prompt)
        self.assertNotIn("# No-audio course review checklist", prompt)

    def test_no_audio_course_includes_no_audio_checklist(self):
        prompt = build_ai_prompt(
            {
                "storyId": 1,
                "name": "Test",
                "courseShort": "nah-es",
                "learningLanguage": "nah",
                "noAudio": True,
                "text": "[LINE]\n> Test",
            }
        )

        self.assertIn("This course is a no-audio course", prompt)
        self.assertIn("# No-audio course review checklist", prompt)
        self.assertIn("meaning-based", prompt)


class FakeResponse:
    def __init__(self):
        self.defer = AsyncMock()
        self.send_message = AsyncMock()


class FakeFollowup:
    def __init__(self):
        self.send = AsyncMock()


class FakeChannel:
    def __init__(self, name="nahuatl-contrib", channel_id=10):
        self.name = name
        self.id = channel_id


class FakeRole:
    def __init__(self, role_id):
        self.id = role_id


def make_member(*role_ids):
    """A guild member mock; passes isinstance(user, discord.Member)."""
    member = MagicMock(spec=discord.Member)
    member.id = 20
    member.roles = [FakeRole(role_id) for role_id in role_ids]
    return member


class FakeInteraction:
    def __init__(self, channel=None, user=None):
        self.channel = channel or FakeChannel()
        self.user = user if user is not None else make_member(ROLE_CONTRIBUTOR)
        self.response = FakeResponse()
        self.followup = FakeFollowup()


class ReviewCommandTest(unittest.IsolatedAsyncioTestCase):
    async def test_unique_contributor_channel_reviews_next_unpublished_set(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock(
            return_value=[
                {
                    "short": "nhe-en",
                    "name": "Nahuatl from English",
                    "learningLanguage": "Nahuatl",
                    "learningLanguageShort": "nhe",
                },
                {
                    "short": "mr-en",
                    "name": "Marathi from English",
                    "learningLanguage": "Marathi",
                    "learningLanguageShort": "mr",
                },
            ]
        )
        client.run_review = AsyncMock()
        interaction = FakeInteraction()

        await client.review_command(interaction)

        interaction.response.defer.assert_awaited_once_with(thinking=True)
        client.run_review.assert_awaited_once_with(
            interaction.channel,
            {"courseShort": "nhe-en", "nextUnpublished": True},
        )

    async def test_ambiguous_channel_offers_course_choices(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock(
            return_value=[
                {
                    "short": "nhe-en",
                    "name": "Nahuatl from English",
                    "learningLanguage": "Nahuatl",
                    "learningLanguageShort": "nhe",
                },
                {
                    "short": "nhe-es",
                    "name": "Nahuatl from Spanish",
                    "learningLanguage": "Nahuatl",
                    "learningLanguageShort": "nhe",
                },
            ]
        )
        client.run_review = AsyncMock()
        interaction = FakeInteraction()

        await client.review_command(interaction)

        client.run_review.assert_not_awaited()
        interaction.followup.send.assert_awaited_once()
        args, kwargs = interaction.followup.send.await_args
        self.assertIn("Which course", args[0])
        self.assertTrue(kwargs["ephemeral"])
        options = kwargs["view"].children[0].options
        self.assertEqual(
            [option.label for option in options],
            ["Nahuatl from English", "Nahuatl from Spanish"],
        )

    async def test_explicit_story_links_override_channel_inference(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock()
        client.run_review = AsyncMock()
        interaction = FakeInteraction(channel=FakeChannel("general-contributors"))

        await client.review_command(
            interaction,
            "https://duostories.org/editor/story/123 and "
            "https://duostories.org/story/456",
        )

        client.get_course_list.assert_not_awaited()
        client.run_review.assert_awaited_once_with(
            interaction.channel, {"storyIds": [123, 456]}
        )

    async def test_story_link_review_respects_an_active_channel_review(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.run_review = AsyncMock()
        interaction = FakeInteraction()
        client.active_threads.add(interaction.channel.id)

        await client.review_command(
            interaction, "https://duostories.org/editor/story/123"
        )

        client.run_review.assert_not_awaited()
        interaction.followup.send.assert_awaited_once()
        _, kwargs = interaction.followup.send.await_args
        self.assertTrue(kwargs["ephemeral"])

    async def test_explicit_set_overrides_next_unpublished_default(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock(
            return_value=[
                {
                    "short": "nhe-en",
                    "name": "Nahuatl from English",
                    "learningLanguage": "Nahuatl",
                    "learningLanguageShort": "nhe",
                }
            ]
        )
        client.run_review = AsyncMock()
        interaction = FakeInteraction()

        await client.review_command(interaction, "set 7")

        client.run_review.assert_awaited_once_with(
            interaction.channel, {"courseShort": "nhe-en", "sets": [7]}
        )

    async def test_dm_user_is_refused_without_starting_anything(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock()
        client.start_slash_payload = AsyncMock()
        interaction = FakeInteraction(user=MagicMock(spec=discord.User))

        await client.review_command(
            interaction, "https://duostories.org/editor/story/123"
        )

        interaction.response.send_message.assert_awaited_once()
        args, kwargs = interaction.response.send_message.await_args
        self.assertIn("Contributor role", args[0])
        self.assertTrue(kwargs["ephemeral"])
        interaction.response.defer.assert_not_awaited()
        client.get_course_list.assert_not_awaited()
        client.start_slash_payload.assert_not_awaited()

    async def test_member_without_contributor_role_is_refused(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.get_course_list = AsyncMock()
        client.start_slash_payload = AsyncMock()
        interaction = FakeInteraction(user=make_member(111, 222))

        await client.review_command(
            interaction, "https://duostories.org/editor/story/123"
        )

        interaction.response.send_message.assert_awaited_once()
        args, kwargs = interaction.response.send_message.await_args
        self.assertIn("Contributor role", args[0])
        self.assertTrue(kwargs["ephemeral"])
        interaction.response.defer.assert_not_awaited()
        client.get_course_list.assert_not_awaited()
        client.start_slash_payload.assert_not_awaited()

    async def test_moderator_role_is_allowed(self):
        client = ReviewClient(intents=discord.Intents.none())
        client.run_review = AsyncMock()
        interaction = FakeInteraction(user=make_member(ROLE_MODERATOR))

        await client.review_command(
            interaction, "https://duostories.org/editor/story/123"
        )

        client.run_review.assert_awaited_once_with(
            interaction.channel, {"storyIds": [123]}
        )

    async def test_contributor_interaction_is_deferred_before_course_fetch(self):
        client = ReviewClient(intents=discord.Intents.none())
        events = []
        courses = [
            {
                "short": "nhe-en",
                "name": "Nahuatl from English",
                "learningLanguage": "Nahuatl",
                "learningLanguageShort": "nhe",
            }
        ]

        async def fake_defer(**kwargs):
            events.append("defer")

        async def fake_course_list():
            events.append("get_course_list")
            return courses

        client.get_course_list = AsyncMock(side_effect=fake_course_list)
        client.run_review = AsyncMock()
        interaction = FakeInteraction()
        interaction.response.defer = AsyncMock(side_effect=fake_defer)

        await client.review_command(interaction)

        # the interaction must be acknowledged BEFORE the (potentially slow)
        # course-list network call, or Discord's 3s ACK window is missed
        self.assertEqual(events, ["defer", "get_course_list"])
        client.run_review.assert_awaited_once()

    def test_review_command_is_registered_guild_only(self):
        client = ReviewClient(intents=discord.Intents.none())

        self.assertTrue(client.tree.get_command("review").guild_only)


if __name__ == "__main__":
    unittest.main()
