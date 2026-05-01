# Unofficial Duolingo Stories

This context describes the domain language for publishing and editing community-translated Duolingo-style stories.

## Language

**Story**:
A course-bound learning unit composed of dialogue, prompts, audio, and metadata.
_Avoid_: Lesson, exercise, activity

**Deleted Story**:
A story hidden from normal workflows without permanently removing its record.
_Avoid_: Archived story, permanently deleted story

**Story Title**:
The learner-facing title of a story.
_Avoid_: Story name

**Course**:
A container for stories for one learning-language/from-language pair.
_Avoid_: Language, localization, course language

**Course Slug**:
The compact course identifier used in URLs and course selection.
_Avoid_: Short code, language code

**Language**:
A reusable language record used by courses, voices, localization strings, avatar mappings, and flags.
_Avoid_: Course

**Language Code**:
The compact identifier for a single language.
_Avoid_: Course slug

**Learning Language**:
The language a course teaches.
_Avoid_: Target language

**From Language**:
The language a course assumes the learner already understands.
_Avoid_: Base language, source language

**Localization**:
A translated UI/app text string for a language.
_Avoid_: Story translation, course translation

**Story Content**:
The editable body of a story, represented both as source text and structured content.
_Avoid_: Story metadata

**Story Text**:
The author-facing textual representation of story content.
_Avoid_: Script

**Story Text Syntax**:
The markup and conventions contributors use inside story text.
_Avoid_: Format, parser syntax

**Structured Story Content**:
The parsed representation of story content used by editors and readers.
_Avoid_: Story JSON

**Story Element**:
One editable item inside a story body, such as a dialogue line, prompt, or challenge.
_Avoid_: Line, item

**Line**:
A text-bearing story element that can have speaker text and audio.
_Avoid_: Story element, file line

**Character**:
A visible or narrative persona used in story content.
_Avoid_: Speaker, avatar, voice

**Character Name**:
The display name for a character in a course or language context.
_Avoid_: Avatar

**Cast**:
The set of characters used by a story, with their names, avatars, and voices resolved for the course.
_Avoid_: Course characters

**Avatar**:
A reusable visual asset that can represent a character.
_Avoid_: Character, speaker, voice

**Avatar Mapping**:
A course- or language-specific assignment of an avatar to a character name and voice.
_Avoid_: Speaker mapping

**Voice**:
A text-to-speech voice or configuration used for story audio.
_Avoid_: Speaker, character, avatar

**Audio File**:
A media file used for story playback.
_Avoid_: Audio timing, voice

**Uploaded Audio**:
An audio file provided by a contributor.
_Avoid_: Generated audio

**Generated Audio**:
An audio file produced from text using a voice.
_Avoid_: Uploaded audio

**Audio Timing**:
Timing data that synchronizes story text with audio playback.
_Avoid_: Audio file, voice

**Story Header**:
The opening story element containing a title, illustration, learning-language content, and optional audio.
_Avoid_: Header, page header, app header

**Story Illustration**:
The visual associated with a story or story header.
_Avoid_: Story image, image

**Challenge**:
An interactive story element that asks the learner to respond.
_Avoid_: Question, exercise

**Story Status**:
The editorial lifecycle state of a story.
_Avoid_: Publication status

**Draft**:
A story status for work that is still being prepared.
_Avoid_: Unpublished

**Feedback**:
A story status for work that has received one approval and is ready for another contributor to review.
_Avoid_: Ready for feedback, review

**Finished**:
A story status for work that has completed the editorial workflow.
_Avoid_: Done

**Approval**:
A contributor review signal in the story editorial workflow.
_Avoid_: Publication, finished

**Publication Visibility**:
Whether a story is visible to learners.
_Avoid_: Story status, finished

**Published**:
A publication visibility value meaning a story is visible to learners.
_Avoid_: Finished

**Unpublished**:
A publication visibility value meaning a story is not visible to learners.
_Avoid_: Draft

**Publish**:
To change story visibility to Published.
_Avoid_: Finish, release

**Story Completion**:
A learner-side record that a user completed a story.
_Avoid_: Finished, done

**TODO**:
A marker written in story text by a contributor to flag something for later attention.
_Avoid_: Task, issue

**Hint**:
Supporting text shown to help learners understand a word or phrase.
_Avoid_: Translation

**Pronunciation Hint**:
Supporting text shown to help learners pronounce a word or phrase.
_Avoid_: Hint, pinyin

**Selectable Phrase**:
A phrase segment the learner can choose or arrange inside a challenge.
_Avoid_: Button

**Story Set**:
A group of stories within a course that is usually published together.
_Avoid_: Course, story status

**Set 0**:
An introductory story set outside the main course canon.
_Avoid_: Main story set

**Source Course**:
A course used as the reference when importing stories for translation into another course.
_Avoid_: Main canon

**Official Course**:
A non-public course imported from Duolingo as raw source material.
_Avoid_: Public course, endorsed course

**Public Course**:
A course visible to learners on the site.
_Avoid_: Published story

**Course Page**:
The public learner-facing page for a course and its published stories.
_Avoid_: Editor course story overview

**Target Course**:
A course that receives imported or translated stories.
_Avoid_: Target language

**Story Import**:
The act of creating a target-course story from a source-course story.
_Avoid_: Translation

**Translation**:
The linguistic work of adapting story content into the target course's learning language.
_Avoid_: Story import

**Learner**:
A user who consumes stories.
_Avoid_: Contributor

**Contributor**:
A user with global permission to edit project content.
_Avoid_: Editor

**Admin**:
A user with project-wide management permissions beyond normal contribution.
_Avoid_: Contributor

**Course Contributor**:
A contributor credited for making a minimum contribution to a course.
_Avoid_: Course-scoped editor, course permission

**Editor Area**:
The authenticated contributor-facing part of the site under `/editor`.
_Avoid_: Story editor, contributor

**Story Editor**:
The editor workspace for one specific story.
_Avoid_: Editor area, contributor

**Bulk Audio Editor**:
A story-level workspace for assigning many audio files and audio timings before applying them to a story.
_Avoid_: Audio cutter, voice editor

**Audio Cutter**:
A tool or workflow for preparing audio segments from longer audio.
_Avoid_: Bulk audio editor

**Story Page**:
The learner-facing page for reading or playing one published story.
_Avoid_: Story editor

**Editor Course Story Overview**:
The editor-area screen for viewing and working through one course's stories.
_Avoid_: Course editor, course story overview

**Character Voice Editor**:
The editor-area screen for assigning character names and voices in a course context.
_Avoid_: Voice editor, speaker editor

**Voice Catalog Editor**:
The editor-area screen for managing available voices.
_Avoid_: Character voice editor, speaker editor

**Course Localization Editor**:
The editor-area screen for editing localization strings in a course context.
_Avoid_: Story translation editor

## Relationships

- A **Course** owns zero or more **Stories**.
- A **Course** owns zero or more **Story Sets**.
- A **Course** has one **Course Slug** when it is addressable in the editor or site.
- A **Course** can be a **Public Course** or non-public.
- A **Public Course** can have one **Course Page**.
- A **Course** can act as a **Source Course** for story imports.
- A **Course** can act as a **Target Course** for story imports.
- An **Official Course** can act as raw material for **Story Imports**.
- A **Source Course** provides stories to one or more **Target Courses**.
- A **Story Import** copies a **Story** from a **Source Course** into a **Target Course**.
- **Translation** can happen after a **Story Import**.
- A **Learner** can create **Story Completions**.
- A **Contributor** can edit project content across courses.
- A **Contributor** can use the **Editor Area**.
- An **Editor Course Story Overview** belongs to one **Course**.
- An **Editor Course Story Overview** is part of the **Editor Area**.
- A **Character Voice Editor** works in one **Course** context.
- A **Character Voice Editor** is part of the **Editor Area**.
- A **Voice Catalog Editor** is part of the **Editor Area**.
- A **Voice Catalog Editor** manages **Voices**.
- A **Course Localization Editor** belongs to one **Course**.
- A **Course Localization Editor** edits **Localization** entries.
- A **Course Localization Editor** is part of the **Editor Area**.
- A **Story Editor** edits one **Story**.
- A **Bulk Audio Editor** belongs to one **Story Editor**.
- A **Bulk Audio Editor** edits **Audio Files** and **Audio Timing** for a **Story**.
- An **Audio Cutter** can produce **Audio Files** for a **Story**.
- A **Story Page** presents one **Published** **Story** to **Learners**.
- An **Admin** can manage content and settings beyond a normal **Contributor**'s scope.
- A **Course Contributor** is credited on public and internal course pages.
- A **Story Set** contains one or more **Stories**.
- A **Course** has exactly one learning **Language**.
- A **Course** has exactly one from **Language**.
- A **Language** has one **Language Code**.
- A **Localization** belongs to exactly one **Language**.
- A **Story** belongs to exactly one **Course**.
- A **Story** belongs to exactly one **Story Set**.
- A **Story** has exactly one **Story Title**.
- A **Story** has exactly one **Story Status**.
- A **Story** can be a **Deleted Story**.
- A **Story** can receive zero or more **Approval** signals.
- A **Story** becomes **Feedback** when it receives its first **Approval**.
- A **Story** becomes **Finished** when it receives two **Approval** signals.
- A **Story** has one **Publication Visibility**.
- A **Story** can have zero or more **Story Completion** records.
- A **Story Completion** belongs to one **Learner**.
- A **Story Text** can contain zero or more **TODO** markers.
- **Story Content** can include **Hint** entries for learner-facing text.
- **Story Content** can include **Pronunciation Hint** entries for learner-facing text.
- A **Challenge** can contain one or more **Selectable Phrase** entries.
- A regular **Story Set** is published when all four of its **Stories** are **Finished**.
- An **Approval** can indirectly trigger publication when it causes the final **Story** in a regular **Story Set** to become **Finished**.
- **Publish** changes one or more **Stories** from **Unpublished** to **Published**.
- **Set 0** can contain fewer than four introductory **Stories**.
- A **Story** has exactly one **Story Content** body.
- **Story Content** has one **Story Text** representation.
- **Story Text** uses **Story Text Syntax**.
- **Story Content** has one **Structured Story Content** representation.
- **Story Content** contains one or more **Story Elements**.
- A **Story Header** is a kind of **Story Element**.
- A **Line** is a kind of **Story Element**.
- A **Challenge** is a kind of **Story Element**.
- A **Story** can have one **Story Illustration**.
- A **Story Header** can show one **Story Illustration**.
- A **Story Header** can have one **Audio File**.
- A **Story Header** can have **Audio Timing** for its **Audio File**.
- A **Line** can be associated with one **Character**.
- A **Character** can have one **Character Name** in a course or language context.
- A **Character** can use one **Avatar** for display.
- A **Character** can use one **Voice** for generated audio.
- A **Story** has one **Cast**.
- A **Cast** contains one or more **Character** entries.
- An **Avatar Mapping** connects an **Avatar** to a **Character Name** and **Voice**.
- **Uploaded Audio** is a kind of **Audio File**.
- **Generated Audio** is a kind of **Audio File**.
- A **Line** can have one **Audio File**.
- A **Line** can have **Audio Timing** for its **Audio File**.

## Example dialogue

> **Dev:** "Can we create a **Story** before choosing where it belongs?"
> **Domain expert:** "No — every **Story** belongs to a **Course**."

## Flagged ambiguities

- "language" is often used informally to mean **Course**, but should be reserved for **Language** unless the learning/from-language pair is irrelevant.
- "line" can mean a story **Line** or a file line number; use **Line** only for story content.
- "header" can mean a **Story Header** or a UI layout header; use **Story Header** for story content.
- "speaker" is overloaded in code and UI; use **Voice** for text-to-speech configuration and **Character** for the story persona.
- "main canon" is not established project language; when referring to import/source guidance, discuss the source course explicitly.
- "editor" can mean the **Editor Area**, the **Story Editor**, or the person doing edits; use **Contributor** for the person.
- "course contributor" is attribution, not authorization; contributors currently have global edit access rather than per-course edit permissions.
- "done" appears in learner completion data; use **Story Completion** for learner progress and **Finished** for editorial status.
- "official" means imported from Duolingo as source material; it does not mean this project is endorsed by Duolingo.
- The first **Approval** often represents an author saying a story is ready for feedback, but the system does not require that approval to come from an author.
- **Approval** signals currently persist across story edits; edits do not reset or stale existing approvals.
