import mysql.connector
import pandas as pd

mydb = mysql.connector.connect(
  host="localhost",
  user="carex",
  password="5hfW-18MSXgYvjrewhbP",
  database="carex_stories"
)

mycursor = mydb.cursor()
mycursor.execute("""SELECT u.username, a.provider_account_id FROM user u JOIN account a on u.id = a.user_id WHERE a.provider = \"discord\"""")
myresult = mycursor.fetchall()

user_discord_id = {}
for user in myresult:
    user_discord_id[user[0]] = user[1]

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

data = pd.read_csv("output.csv")
data["story_id"] = [int(str(file).split("/")[1][:-4]) for file in data["filename"]]
del data["Unnamed: 0"]

data0 = data
data = data[data.percentage >= 0.1]
data = data[data.lines >= 3]

data = pd.concat([data_approval, data])
#data = data[data.story_id == 1854]

data = data.sort_values("story_id", ascending=False)
#print(data)
data = data.groupby(["story_id", "author"]).max().reset_index().sort_values("story_id", ascending=False)
data = data[data.public == 1]
print(data)
data.to_csv("joined.csv")
#exit()
milestones = [4, 8, 20, 40, 80, 120]
data = data.groupby("author").max().sort_values("number", ascending=False)
for mile in milestones[::-1]:
    print("----", mile, 'stories', "----")
    d = data[data.number >= mile]
    for i, author in d.iterrows():
        print(i, author.number, f"({len(data0[data0.author == i])})", user_discord_id.get(i, "none"))
    data = data[data.number < mile]
