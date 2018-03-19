from flask import render_template, redirect
from . import app

#forms
from .forms import *

#index
@app.route("/", methods=('GET', 'POST'))
@app.route("/index", methods=('GET', 'POST'))
def index():
	title = "icrdr"
	return render_template("index.html",
	title = title)

#experiment lung segment display
@app.route("/experiment/lungSeg")
def lungSeg():
    return render_template("lungSeg.html")
	
#404
@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404