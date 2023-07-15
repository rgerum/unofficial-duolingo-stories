import subprocess
from pathlib import Path
import time

start_time = time.time()
def get_commits_per_file(filename):
    a = subprocess.run(["git", "rev-list", "HEAD", "--oneline", filename], capture_output=True)
    out = a.stdout
    #print(a.stdout)
    #try:
    #    out = a.stdout.decode()
    #except UnicodeDecodeError:
    #    out = a.stdout.decode("cp1252")
    lines = [l.split(b" ", 1) for l in out.split(b"\n") if l.strip() != b'']
    #print(lines)
    return lines

def get_author_percentages(filename, ignore_rev=None):
    print(filename)
    if ignore_rev is None:
        ignore_rev = get_commits_per_file(filename)[-1][0].decode()
    if ignore_rev:
        #print(subprocess.run(["git", "show", ignore_rev+":"+str(filename)], capture_output=True, text=True).stdout)
        base_file = [l.strip() for l in subprocess.run(["git", "show", ignore_rev+":"+str(filename)], capture_output=True, text=True).stdout.split("\n")]
    else:
        base_file = []
    #print(" ".join(["git", "blame", "-w", filename]))
    a = subprocess.run(["git", "blame", "-w", filename], capture_output=True, text=True)
    authors = {}
    count = 0
    for i, line in enumerate(a.stdout.split("\n")):
        try:
            line_content = line.split(")", 1)[1].strip()
            author = line.split(" ")[1][1:]
            if line_content == "":
                continue
            found = False
            for l in base_file:
                if line_content == l:
                    found = True
                    break
            if found:
                #print(found, author, line_content, l)
                continue
            #print(False, author, line_content)

            if author not in authors:
                authors[author] = 0
            authors[author] += 1
            count += 1
        except IndexError:
            pass
    #for author in authors:
    #    authors[author] /= count
    print("---------", filename, authors)
    return authors, count

if 0:
    filename = "91/6920.txt"
    filename = "93/6170.txt"
    filename = "9/646.txt"
    filename = "129/4303.txt"
    filename = "132/4716.txt"
    get_commits_per_file(filename)
    get_author_percentages(filename)
    #get_author_percentages(filename, get_commits_per_file(filename)[-1][0])
    exit()

def get_files_since_commit(commit):
    print(" ".join(["git", "diff", "--name-only", commit, "HEAD"]))
    a = subprocess.run(["git", "diff", "--name-only", commit, "HEAD"], capture_output=True, text=True)
    print(a.stdout)
    files = [f for f in a.stdout.split("\n") if f != '']
    return files

import pandas as pd
data_old = pd.read_csv("output.csv")

new_files = Path(".").glob("**/*.txt")
print(Path("last_commit.txt").read_text())
new_files = get_files_since_commit(Path("last_commit.txt").read_text().strip())
print(new_files)

data = []
for file in new_files:
    #for file in Path("99").glob("*.txt"):
    print(len(data_old))
    data_old = data_old[data_old.filename != file]
    print(len(data_old))
    authors, count = get_author_percentages(file)
    for author in authors:
        data.append(dict(author=author, filename=file, story_id=str(file).split("/")[1][:-4], percentage=authors[author]/count, lines=authors[author]))
    print(data)

import pandas as pd
data = pd.DataFrame(data)
data = pd.concat((data, data_old))
data = data.sort_values(["author", "percentage"], ascending=False)
counter = 0
last_author = 0
def count(x):
    global counter, last_author
    #print(x)
    if x.author != last_author:
        last_author = x.author
        counter = 0
    counter += 1
    return counter

data["number"] = data.apply(count, axis=1)

import os
os.system("git rev-parse HEAD > last_commit.txt")

data.to_csv("output.csv")
print(data)
print(start_time - time.time())