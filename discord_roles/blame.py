import subprocess
from pathlib import Path
import pandas as pd
import time
import os


def get_commits_per_file(filename):
    a = subprocess.run(["git", "rev-list", "HEAD", "--oneline", filename], capture_output=True)
    out = a.stdout
    lines = [l.split(b" ", 1) for l in out.split(b"\n") if l.strip() != b'']
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

def get_new_file_list():
    try:
        print(Path("last_commit.txt").read_text())
        new_files = get_files_since_commit(Path("last_commit.txt").read_text().strip())
    except FileNotFoundError:
        new_files = Path(".").glob("**/*.txt")
    print(new_files)
    return new_files

def update_repo():
    os.chdir("../../")
    if not Path("unofficial-duolingo-stories-content").exists():

        os.system("git clone https://github.com/rgerum/unofficial-duolingo-stories-content")
    os.chdir("unofficial-duolingo-stories-content")
    os.system("git pull")


def update_output_csv():
    start_time = time.time()
    update_repo()
    data_old = pd.read_csv("output.csv")
    data_old["story_id"] = [int(str(file).split("/")[1][:-4]) for file in data_old["filename"]]

    data = []
    for file in get_new_file_list():
        #for file in Path("99").glob("*.txt"):
        print(len(data_old))
        data_old = data_old[data_old.filename != file]
        print(len(data_old))
        authors, count = get_author_percentages(file)
        for author in authors:
            data.append(dict(author=author, filename=file, story_id=str(file).split("/")[1][:-4], percentage=authors[author]/count, lines=authors[author]))
        print(data)

    data = pd.DataFrame(data)
    data = pd.concat((data, data_old))
    data = data.sort_values(["author", "percentage"], ascending=False)
    counter = 0
    last_author = 0
    def count(x):
        nonlocal counter, last_author
        #print(x)
        if x.author != last_author:
            last_author = x.author
            counter = 0
        counter += 1
        return counter

    data["number"] = data.apply(count, axis=1)

    os.system("git rev-parse HEAD > last_commit.txt")

    data.to_csv("output.csv", index=False)
    print(data)
    print(time.time() - start_time, "s")


if __name__ == "__main__":
    update_output_csv()