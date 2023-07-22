import discord
from pathlib import Path

params = Path(__file__).parent / ".env.local"
params = {f.split("=")[0]:f.split("=")[1] for f in params.read_text().split("\n") if f != ''}
def set_user_roles(users_and_role):
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
            for USER_ID, target_count in users_and_role:
                print("USER_ID", USER_ID)
                try:
                    member = await guild.fetch_member(USER_ID)
                except discord.errors.NotFound:
                    print("NOT FOUND")
                    continue
                if member is None:
                    print('Member not found')
                    await bot.close()
                    return

                print(member.roles)
                role_max = max([0]+[int(role.name[:-len(" Stories")]) for role in member.roles if "Stories" in role.name])
                print("max", role_max, role_max < target_count, target_count, member.roles)
                if role_max < target_count:
                    #target_count = 4
                    # Add the role to the member
                    #await member.add_roles(roles[target_count])
                    #await member.remove_roles(*[role for k, role in roles.items() if k != target_count])
                    print(f'Role {roles[target_count].name} added to {member.name}')
                    print(f'Roles {[role.name for k, role in roles.items() if k != target_count]} removed from {member.name}')
            await bot.close()

        # Start the bot
        bot.run(TOKEN)
        exit()
    except:
        return


if __name__ == "__main__":

    from combine import get_milestone_grouped
    users_and_role = get_milestone_grouped()
    print(users_and_role)
    set_user_roles(users_and_role)
    print(users_and_role)