from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField
from wtforms.validators import DataRequired, InputRequired

class MyForm(FlaskForm):
    name = StringField('name', validators=[DataRequired()])

class SmathForm(FlaskForm):
    input_a = IntegerField('input_a', validators=[InputRequired()])
    input_b = IntegerField('input_b', validators=[InputRequired()])