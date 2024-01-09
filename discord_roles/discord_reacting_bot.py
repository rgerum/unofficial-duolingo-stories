import discord
from pathlib import Path

import mysql.connector
import pandas as pd
import psycopg


def get_duostories_id(discord_id):
    # Connect to an existing database
    with psycopg.connect(PG_URL) as conn:
        # Open a cursor to perform database operations
        with conn.cursor() as cur:
            # Query the database and obtain data as Python objects.
            cur.execute("SELECT \"userId\" FROM accounts WHERE provider = 'discord' AND \"providerAccountId\" = %s LIMIT 1", [str(discord_id)])
            if cur:
                return cur.fetchone()[0]

def set_user_role(discord_id, role):
    # Connect to an existing database
    with psycopg.connect(PG_URL) as conn:
        # Open a cursor to perform database operations
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET role = %s WHERE users.id = (SELECT \"userId\" FROM accounts WHERE provider = 'discord' AND \"providerAccountId\" = %s LIMIT 1);", [role == 1, str(discord_id)])
            conn.commit()

        # Open a cursor to perform database operations
        with conn.cursor() as cur:
            cur.execute(
                "SELECT \"userId\", users.name, role FROM accounts JOIN users ON \"userId\" = users.id WHERE provider = 'discord' AND \"providerAccountId\" = %s LIMIT 1",
                [str(discord_id)])
            if cur:
                return cur.fetchone()

# Replace 'YOUR_BOT_TOKEN' with your actual bot token obtained from the Discord Developer Portal.
params = Path(__file__).parent / ".env.local"
params = {f.split("=")[0]:f.split("=")[1] for f in params.read_text().split("\n") if f != ''}

PG_URL = params['POSTGRES_URL']

TOKEN = params['DISCORD_TOKEN']
CHANNEL_CONTRIBUTOR_REQUEST = 1132747276234792980
#CHANNEL_CONTRIBUTOR_REQUEST = 1133167220109877280  # test channel
CHANNEL_BOT_LOG = 1133529323396145172

ROLE_MODERATOR = 735581436903424120
ROLE_CONTRIBUTOR = 941815741143977994

class MyClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        if message.author == client.user:
                return  # Ignore messages sent by the bot itself

        # for the contributor request channel
        if getattr(message.channel, "parent", None) and message.channel.parent.id == CHANNEL_CONTRIBUTOR_REQUEST:
            channel = message.channel
            # get the applicants message
            first_message = await channel.fetch_message(channel.id)

            # check if they are connected
            duostories_id = get_duostories_id(first_message.author.id)
            if duostories_id:
                await first_message.add_reaction('🔗')
                await first_message.remove_reaction('✖️', client.user)
                await first_message.remove_reaction('❌', client.user)
            else:
                await first_message.add_reaction('❌')
                await first_message.remove_reaction('🔗', client.user)
                if message.id == first_message.id:
                    await message.channel.send("Please connect your Duostories account to your Discord account (on https://duostories.org/profile). Then post another message here and I will check again.")

    async def check_reaction(self, reaction):
        # Check if the reacting user is a moderator
        is_moderator = discord.utils.get(reaction.member.roles, id=ROLE_MODERATOR)

        if reaction.member == client.user:
            return  # Ignore reactions on the bot's own messages

        if is_moderator and reaction.emoji.name == '✅':

            # Get the channel where the reaction occurred
            channel = client.get_channel(reaction.channel_id)

            is_contributor_request_channel = False
            try:
                if channel.parent.id == CHANNEL_CONTRIBUTOR_REQUEST:
                    is_contributor_request_channel = True
            except AttributeError:
                is_contributor_request_channel = False

            if is_contributor_request_channel is False:
                return None

            # Fetch the message using the message_id from the payload
            message = await channel.fetch_message(reaction.message_id)

            first_message = await channel.fetch_message(channel.id)

            if message == first_message:
                return message
        return None

    async def on_raw_reaction_add(self, reaction):
        if message := await self.check_reaction(reaction):
            await message.add_reaction('✅')  # React to the moderator's reaction with a thumbs-up emoji

            user = message.author
            guild = client.get_guild(reaction.guild_id)
            user_member = await guild.fetch_member(user.id)

            role_to_give = discord.utils.get(guild.roles, id=ROLE_CONTRIBUTOR)

            if user_member and role_to_give:
                await user_member.add_roles(role_to_give)
                await self.log(f"🧑‍💻️ I gave {user.name} the role {role_to_give.name}.")
                print(f"Gave {user.name} the role: {role_to_give.name}")

                duostories_id = get_duostories_id(user.id)
                if duostories_id:
                    await message.channel.send("I gave you the **Contributor** role and activated your account on Duostories.\nIf you are currently logged in on https://duostories.org, please log out and in again for the changes to take effect.\nYou can then access the editor at https://duostories.org/editor.")
                else:
                    await message.channel.send("I gave you the **Contributor** role and but I could not activate your account on Duostories as you haven't connected your duostories account to discord.")

    async def on_raw_reaction_remove(self, reaction):
        if message := await self.check_reaction(reaction):
            await message.remove_reaction('✅', client.user)

    async def on_member_update(self, before, after):
        # Check if roles have been added or removed
        roles_added = set(after.roles) - set(before.roles)
        roles_removed = set(before.roles) - set(after.roles)

        if roles_added:
            for role in roles_added:
                if role.id == ROLE_CONTRIBUTOR:
                    print("update database")
                    try:
                        result = set_user_role(after.id, 1)
                        if result is not None:
                            await self.log(f"📝 added write permissions for {after.name}. Duostories id={result[0]} username={result[1]} write={result[2]} https://duostories.org/admin/users/{result[0]}")
                        else:
                            await self.log(f"⚠️ could not add write permissions for {after.name}, account is not linked to duostories.")
                    except Exception as err:
                        print(err)
                        await self.log(f"⚠️ could not added write permissions for {after.name}, a database error occurred.")
                print(f"User {after.name} has been given the role: {role.name}")

            # Add your reaction logic here for when roles are added to a user.
            # For example, you could send a message or give another role.

        if roles_removed:
            for role in roles_removed:
                if role.id == ROLE_CONTRIBUTOR:
                    print("update database")
                    try:
                        result = set_user_role(after.id, 0)
                        if result is not None:
                            await self.log(f"❌ removed write permissions for {after.name}. Duostories id={result[0]} username={result[1]} write={result[2]} https://duostories.org/admin/users/{result[0]}")
                        else:
                            await self.log(f"⚠️ could not remove write permissions for {after.name}, account is not linked to duostories.")
                    except Exception as err:
                        print(err)
                        await self.log(f"⚠️ could not remove write permissions for {after.name}, a database error occoured.")
                print(f"User {after.name} has lost the role: {role.name}")

            # Add your reaction logic here for when roles are removed from a user.
            # For example, you could send a message or remove another role.

    async def log(self, message):
        channel = self.get_channel(CHANNEL_BOT_LOG)
        await channel.send(message)


intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
intents.members = True

client = MyClient(intents=intents)
# Run the bot with the specified token
client.run(TOKEN)