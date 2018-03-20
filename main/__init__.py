from flask import Flask
from flask_wtf.csrf import CSRFProtect
from flaskext.mysql import MySQL
from . import config

app = Flask(__name__)
app.config.from_object(config)
CSRFProtect(app)

mysql = MySQL()
mysql.init_app(app)

from . import views