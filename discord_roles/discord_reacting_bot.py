import discord
import json
from urllib import error, request
from pathlib import Path

def parse_env_file(path):
    values = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


def sync_user_role(discord_id, write=None):
    payload = {
        "secret": CONVEX_DISCORD_SYNC_SECRET,
        "discordAccountId": str(discord_id),
        "write": write if write is None else bool(write),
    }
    req = request.Request(
        CONVEX_DISCORD_SYNC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body
    except error.HTTPError as err:
        details = err.read().decode("utf-8")
        raise RuntimeError(f"convex sync failed: HTTP {err.code}: {details}") from err
    except Exception as err:
        raise RuntimeError(f"convex sync failed: {err}") from err

# Replace 'YOUR_BOT_TOKEN' with your actual bot token obtained from the Discord Developer Portal.
params = Path(__file__).parent / ".env.local"
params = parse_env_file(params)

TOKEN = params['DISCORD_TOKEN']
CONVEX_DISCORD_SYNC_URL = params['CONVEX_DISCORD_SYNC_URL']
CONVEX_DISCORD_SYNC_SECRET = params['DISCORD_ROLE_SYNC_SECRET']
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
            result = sync_user_role(first_message.author.id, None)
            if result.get("linked"):
                await first_message.add_reaction('🔗')
                await first_message.remove_reaction('✖️', client.user)
                await first_message.remove_reaction('❌', client.user)
            else:
                await first_message.add_reaction('❌')
                await first_message.remove_reaction('🔗', client.user)
                if message.id == first_message.id:
                    await message.channel.send("Please connect your Duostories account to your Discord account (on <https://duostories.org/profile>). Then post another message here and I will check again.")

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

                try:
                    result = sync_user_role(user.id, True)
                    user_data = result.get("user") if isinstance(result, dict) else None
                    if result.get("linked") and user_data:
                        role_name = user_data.get("role", "unknown")
                        user_id = user_data.get("id")
                        username = user_data.get("name", "")
                        await self.log(f"📝 added write permissions for {user.name}. Duostories id={user_id} username={username} role={role_name} <https://duostories.org/admin/users/{user_id}>")
                        await message.channel.send("I gave you the **Contributor** role and activated your account on Duostories.\nIf you are currently logged in on <https://duostories.org>, please log out and in again for the changes to take effect.\nYou can then access the editor at <https://duostories.org/editor>.")
                    else:
                        await message.channel.send("I gave you the **Contributor** role but I could not activate your account on Duostories because you haven't connected your Duostories account to Discord.")
                except Exception as err:
                    print(err)
                    await self.log(f"⚠️ could not add write permissions for {user.name}, a database error occurred.")
                    await message.channel.send("I gave you the **Contributor** role, but I could not activate your account on Duostories because a database error occurred.")

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
                        result = sync_user_role(after.id, True)
                        user_data = result.get("user") if isinstance(result, dict) else None
                        if result.get("linked") and user_data and result.get("updated"):
                            role_name = user_data.get("role", "unknown")
                            user_id = user_data.get("id")
                            username = user_data.get("name", "")
                            await self.log(f"📝 added write permissions for {after.name}. Duostories id={user_id} username={username} role={role_name} <https://duostories.org/admin/users/{user_id}>")
                        elif not result.get("linked"):
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
                        result = sync_user_role(after.id, False)
                        user_data = result.get("user") if isinstance(result, dict) else None
                        if result.get("linked") and user_data:
                            role_name = user_data.get("role", "unknown")
                            user_id = user_data.get("id")
                            username = user_data.get("name", "")
                            await self.log(f"❌ removed write permissions for {after.name}. Duostories id={user_id} username={username} role={role_name} <https://duostories.org/admin/users/{user_id}>")
                        else:
                            await self.log(f"⚠️ could not remove write permissions for {after.name}, account is not linked to duostories.")
                    except Exception as err:
                        print(err)
                        await self.log(f"⚠️ could not remove write permissions for {after.name}, a database error occurred.")
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
