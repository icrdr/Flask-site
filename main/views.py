from flask import render_template, redirect
from . import app
from .forms import *
from .smath import sum

users = [
	{'nickname':'sss', 'name':'xxx'},
	{'nickname':'web', 'name':'fev'},
]

@app.route("/", methods=('GET', 'POST'))
@app.route("/index", methods=('GET', 'POST'))
def index():
	form = SmathForm()
	output = 'Output Here'
	if form.validate_on_submit():
		output = sum.sadd(form.input_a.data, form.input_b.data)
		print (output)
	return render_template("index.html",
	form = form,
	output = output)
	
@app.route("/threejs")
def lung_show():
    return render_template("lung_show.html")
	
@app.route('/submit', methods=('GET', 'POST'))
def submit():
    form = MyForm()
    if form.validate_on_submit():
        print (form.name.data)
    return render_template('submit.html', form=form)