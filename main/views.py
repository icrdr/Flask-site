from flask import render_template
from main import app

users = [
	{'nickname':'sss', 'name':'xxx'},
	{'nickname':'web', 'name':'fev'},
]

@app.route("/")
@app.route("/index")
def hello():
    return render_template("index.html",
	user = users[1],
	title = 'welcome')