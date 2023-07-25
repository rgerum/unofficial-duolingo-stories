import discord
from pathlib import Path

import mysql.connector
import pandas as pd

mydb = mysql.connector.connect(
  host="localhost",
  user="duostori",
  password="VtyX.sXIYeiHR_:vI.aa",
  database="duostori"
)

def get_duostories_id(discord_id):
    mycursor = mydb.cursor()
    mycursor.execute("""SELECT user_id FROM account WHERE provider = "discord" AND provider_account_id = %s LIMIT 1""", [discord_id])
    myresult = mycursor.fetchall()
    if len(myresult):
        return myresult[0][0]

def set_user_role(discord_id, role):
    # update the user
    mycursor = mydb.cursor()
    mycursor.execute(f"""UPDATE user SET role = {int(role)} WHERE user.id = (SELECT user_id FROM account WHERE provider = 'discord' AND provider_account_id = '{discord_id}' LIMIT 1);""")
    myresult = mycursor.fetchall()

    # check
    mycursor = mydb.cursor()
    mycursor.execute("""SELECT user_id, role FROM account JOIN user ON user_id = user.id WHERE provider = "discord" AND provider_account_id = %s LIMIT 1""", [discord_id])
    myresult = mycursor.fetchall()
    print(myresult)

# Replace 'YOUR_BOT_TOKEN' with your actual bot token obtained from the Discord Developer Portal.
params = Path(__file__).parent / ".env.local"
params = {f.split("=")[0]:f.split("=")[1] for f in params.read_text().split("\n") if f != ''}

TOKEN = params['DISCORD_TOKEN']


class MyClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        if message.author == client.user:
                return  # Ignore messages sent by the bot itself

        # for the contributor request channel
        if getattr(message.channel, "parent", None) and message.channel.parent.id == 1133167220109877280:
            channel = message.channel
            # get the applicants message
            first_message = await channel.fetch_message(channel.id)

            # check if they are connected
            duostories_id = get_duostories_id(first_message.author.id)
            if duostories_id:
                await first_message.add_reaction('🔗')
                await first_message.remove_reaction('✖️', client.user)
            else:
                await first_message.add_reaction('✖️')
                await first_message.remove_reaction('🔗', client.user)
                if message.id == first_message.id:
                    await message.channel.send("Please connect your Duostories account to your Discord account (on https://duostories.org/profile). Then post another message here and I will check again.")

    async def check_reaction(self, reaction):
        # Check if the reacting user is a moderator
        is_moderator = discord.utils.get(reaction.member.roles, id=735581436903424120)

        if reaction.member == client.user:
            return  # Ignore reactions on the bot's own messages

        if is_moderator and reaction.emoji.name == '✅':

            # Get the channel where the reaction occurred
            channel = client.get_channel(reaction.channel_id)

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

            role_to_give = discord.utils.get(guild.roles, id=941815741143977994)

            if user_member and role_to_give:
                await user_member.add_roles(role_to_give)
                self.log(f"🧑‍💻️ I gave {user.name} the role {role_to_give.name}.")
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
                if role.id == 941815741143977994:
                    print("update database")
                    try:
                        set_user_role(after.id, 1)
                        self.log(f"📝 added write permissions for {after.name}")
                    except:
                        self.log(f"⚠️ could not added write permissions for {after.name}, a database error occoured.")
                else:
                    self.log(f"⚠️ could not add write permissions for {after.name}, account is not linked to duostories.")
                print(f"User {after.name} has been given the role: {role.name}")

            # Add your reaction logic here for when roles are added to a user.
            # For example, you could send a message or give another role.

        if roles_removed:
            for role in roles_removed:
                if role.id == 941815741143977994:
                    print("update database")
                    try:
                        set_user_role(after.id, 0)
                        self.log(f"❌ removed write permissions for {after.name}")
                    except:
                        self.log(f"⚠️ could not remove write permissions for {after.name}, a database error occoured.")
                else:
                    self.log(f"⚠️ could not remove write permissions for {after.name}, account is not linked to duostories.")
                print(f"User {after.name} has lost the role: {role.name}")

            # Add your reaction logic here for when roles are removed from a user.
            # For example, you could send a message or remove another role.

    async def log(self, message):
        channel = self.get_channel(1133529323396145172)
        channel.send(message)


intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
intents.members = True

client = MyClient(intents=intents)
# Run the bot with the specified token
client.run(TOKEN)