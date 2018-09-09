
from flask import render_template, request, jsonify, flash, redirect, url_for, make_response
from . import app
import os
#导入所有表单
from .forms import *


#主站
@app.route('/<path>')
def today(path):
    base_dir = os.path.dirname(__file__)
    resp = make_response(open(os.path.join(base_dir, path)).read())
    resp.headers["Content-type"]="application/json;charset=UTF-8"
    return resp

@app.route("/")
@app.route("/index")
def homepage():
	return render_template("index.html")

#experiment liverDisplay
@app.route("/experiment/liverDisplay")
def liver_page():
    return render_template("liverDisplay.html")

#experiment lung segment display
@app.route("/experiment/lungSeg")
def lungSeg_page():
    return render_template("lungSeg.html")

#experiment stipplingShader
@app.route("/experiment/stippling")
def stippling_page():
    return render_template("stippling.html")

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
