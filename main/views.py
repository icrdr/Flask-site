from flask import render_template, request, jsonify, flash, redirect, url_for
from . import app

#forms
from .forms import *

#index
@app.route("/")
@app.route("/index")
def homepage():
	cursor = mysql.
	return render_template("index.html")

#experiment lung segment display
@app.route("/experiment/lungSeg")
def lungSeg_page():
    return render_template("lungSeg.html")

#404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404
	
@app.route('/process', methods=['POST'])
def process():
    a = int(request.form['input_a'])
    b = int(request.form['input_b'])
    return jsonify({'output': a+b })

 #forms test
@app.route("/forms", methods=['GET', 'POST'])
def forms_page():
	error = None
	if request.method == "POST":
		attempted_info = request.form['info']
		flash(attempted_info)
		if attempted_info == "fuck":
			return redirect(url_for('homepage'))
		else:
			error = "not a fuck. please fuck."
	return render_template("forms.html", error = error)