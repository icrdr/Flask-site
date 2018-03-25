from flask import render_template, request, jsonify, flash, redirect, url_for
from . import app

#导入所有表单
from .forms import *

#主站
@app.route("/")
@app.route("/index")
def homepage():
	return render_template("index.html")

#experiment lung segment display
@app.route("/experiment/lungSeg")
def lungSeg_page():
    return render_template("lungSeg.html")

#404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

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
