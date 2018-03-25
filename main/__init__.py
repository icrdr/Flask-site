from flask import Flask
from flask_wtf.csrf import CSRFProtect
from . import config

app = Flask(__name__)
app.config.from_object(config)
CSRFProtect(app)

from . import views
