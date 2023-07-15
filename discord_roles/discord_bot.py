import discord

# Token of your Discord bot
TOKEN = ''

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
intents.members = True  # Enable the Members intent
bot = discord.Client(intents=intents)

# Event triggered when the bot is ready
@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name}')

    # Fetch the server (guild) from its ID
    guild = bot.get_guild(GUILD_ID)
    if guild is None:
        print('Guild not found')
        await bot.close()
        return

    # Fetch the role from its ID
    roles = {k: guild.get_role(v) for k, v in ROLE_ID.items()}

    # Fetch the member from their ID
    print(guild.name)
    member = await guild.fetch_member(USER_ID)
    if member is None:
        print('Member not found')
        await bot.close()
        return

    target_count = 4
    # Add the role to the member
    await member.add_roles(roles[target_count])
    await member.remove_roles(*[role for k, role in roles.items() if k != target_count])
    print(f'Role {roles[target_count].name} added to {member.name}')
    print(f'Roles {[role.name for k, role in roles.items() if k != target_count]} removed from {member.name}')
    await bot.close()

# Start the bot
bot.run(TOKEN)