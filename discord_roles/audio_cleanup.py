import mysql.connector
import re
from pathlib import Path
import shutils

mydb = mysql.connector.connect(
  host="localhost",
  user="carex",
  password="5hfW-18MSXgYvjrewhbP",
  database="carex_stories"
)

def move(source, target):
    if not Path(target).parent.exits():
        Path(target).parent.mkdir(parent=True)
    shutils.move(source, target)


os.chdir("../..")
shutils.move("audio", "audio_old")

page = 10
offset = 0
while True:
    mycursor = mydb.cursor()
    mycursor.execute(f"SELECT id, course_id, text FROM story ORDER BY id LIMIT {page} OFFSET {offset}")
    myresult = mycursor.fetchall()
    offset += page

    if len(myresult) == 0:
        break

    for id, course_id, text in myresult:
        #print(id, course_id, text)
        #print(re.findall(r"\$(.*[^\/])\/([^\/]*\.mp3)", text))
        print(re.findall(r"\$(.*\.mp3)", text))
        for file in re.findall(r"\$(.*\.mp3)", text):
            move(Path("audio_old") / file, Path("audio") / file)
