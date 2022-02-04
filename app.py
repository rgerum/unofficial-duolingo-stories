from flask import Flask
from flask import Flask, render_template, send_from_directory
import os
from flask import request

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whereyourfilesare")
from pathlib import Path
@app.route('/login', methods=['GET'])
def login():
    print(request.path)
    p = Path(request.args.get('key', ''))
    print(p)
    return send_from_directory(p.parent, p.name)

@app.route('/store', methods=['GET', 'POST'])
def getfiles():
    import re
    import tifffile
    filename = request.args.get('id', '')
    filename = "duolingo_data/"+filename+".txt"
    print(filename)
    json = request.form['json']
    with open(filename, "w") as fp:
        fp.write(json)
    return "done " + filename
