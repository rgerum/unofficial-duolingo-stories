import mysql.connector
import pandas as pd

mydb = mysql.connector.connect(
  host="localhost",
  user="carex",
  password="5hfW-18MSXgYvjrewhbP",
  database="carex_stories"
)

def get_user_to_discord_mapping():
    mycursor = mydb.cursor()
    mycursor.execute("""SELECT u.username, a.provider_account_id FROM user u JOIN account a on u.id = a.user_id WHERE a.provider = \"discord\"""")
    myresult = mycursor.fetchall()

    user_discord_id = {}
    for user in myresult:
        user_discord_id[user[0]] = user[1]
    return user_discord_id

def get_user_approval_count():
    mycursor = mydb.cursor()
    mycursor.execute("""
    SELECT user.username, story_approval.story_id, story_approval.date, s.public FROM story_approval
        JOIN user ON user.id = story_approval.user_id
        JOIN story s on s.id = story_approval.story_id
        order by story_approval.story_id, story_approval.date""")

    myresult = mycursor.fetchall()


    last_id = None
    count = 0
    data_approval = []
    for x in myresult:
        if x[1] != last_id:
            last_id = x[1]
            count = 0
        count += 1

        if count > 2:
            continue
            #print(x, "---------")
        else:
            #print(x)
            data_approval.append(dict(author=x[0], story_id=x[1], approval=1, public=x[-1]))
    data_approval = pd.DataFrame(data_approval)
    return data_approval


def join_and_group_data():
    from blame import update_output_csv
    update_output_csv()
    data = pd.read_csv("output.csv")
    data["story_id"] = [int(str(file).split("/")[1][:-4]) for file in data["filename"]]

    data0 = data
    data = data[data.percentage >= 0.1]
    data = data[data.lines >= 3]

    data = pd.concat([get_user_approval_count(), data])
    #data = data[data.story_id == 1854]

    data = data.sort_values("story_id", ascending=False)
    #print(data)
    data = data.groupby(["story_id", "author"]).max(["number", "story_id", "percentage", "lines"])
    data = data.reset_index().sort_values("story_id", ascending=False)

    data = data[data.public == 1]
    print(data)
    data.to_csv("joined.csv")
    data = data.groupby("author").max().sort_values("number", ascending=False)
    return data, data0

def get_milestone_grouped():
    data, data0 = join_and_group_data()
    milestones = [4, 8, 20, 40, 80, 120]

    user_discord_id = get_user_to_discord_mapping()
    user_roles = []
    for mile in milestones[::-1]:
        print("----", mile, 'stories', "----")
        d = data[data.number >= mile]
        for i, author in d.iterrows():
            print(i, author.number, f"({len(data0[data0.author == i])})", user_discord_id.get(i, "none"))
            if user_discord_id.get(i, None):
                user_roles.append([user_discord_id.get(i), mile])
        data = data[data.number < mile]
    print(user_roles)
    return user_roles

if __name__ == "__main__":
    get_milestone_grouped()