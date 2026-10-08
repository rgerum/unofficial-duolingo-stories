import unittest
from unittest.mock import AsyncMock, patch

import discord

with patch("pathlib.Path.read_text", return_value=""):
    from discord_review_bot import (
        ReviewClient,
        build_ai_prompt,
        has_story_issue_permission,
        format_story_for_ai_review,
        normalize_story_issue_min_confidence,
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


class FakeUser:
    id = 20
    roles = []

    class guild_permissions:
        administrator = False
        manage_guild = False


class FakeRole:
    def __init__(self, name, role_id=1):
        self.name = name
        self.id = role_id


class FakeContributorUser:
    id = 21
    roles = [FakeRole("Contributor")]

    class guild_permissions:
        administrator = False
        manage_guild = False


class FakeInteraction:
    def __init__(self, channel=None):
        self.channel = channel or FakeChannel()
        self.user = FakeUser()
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
        interaction.response.send_message.assert_awaited_once()
        args, kwargs = interaction.response.send_message.await_args
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
        interaction.response.send_message.assert_awaited_once()

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


class StoryIssueLinkTest(unittest.TestCase):
    def test_unknown_auto_post_confidence_threshold_falls_back_to_high(self):
        self.assertEqual(normalize_story_issue_min_confidence("none"), "high")
        self.assertEqual(normalize_story_issue_min_confidence("off"), "high")
        self.assertEqual(normalize_story_issue_min_confidence("medium"), "medium")

    def test_contributor_role_can_use_link_commands(self):
        self.assertTrue(has_story_issue_permission(FakeContributorUser()))

    def test_auto_post_requires_story_id_course_and_min_confidence(self):
        client = ReviewClient(intents=discord.Intents.none())
        valid_match = {
            "matchFound": True,
            "confidence": "high",
            "storyId": 9486,
            "courseShort": "eu-en",
        }

        self.assertTrue(client.should_auto_post_story_issue_match(valid_match))
        self.assertFalse(
            client.should_auto_post_story_issue_match(
                {
                    "matchFound": True,
                    "confidence": "low",
                    "storyId": 9486,
                    "courseShort": "eu-en",
                }
            )
        )
        self.assertFalse(
            client.should_auto_post_story_issue_match(
                {**valid_match, "matchFound": False}
            )
        )
        self.assertFalse(
            client.should_auto_post_story_issue_match(
                {**valid_match, "storyId": None}
            )
        )
        self.assertFalse(
            client.should_auto_post_story_issue_match(
                {**valid_match, "courseShort": None}
            )
        )


if __name__ == "__main__":
    unittest.main()
