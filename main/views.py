from flask import render_template
from main import app

@app.route("/")
@app.route("/index")
@app.route("/threejs")
def hello():
    return render_template("index.html")