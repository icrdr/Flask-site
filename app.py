from flask import Flask, request
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

todos = {}

class TodoSimple(Resource):
    def get(self, todo_id):
        return {'tododododo'+str(todo_id): todos[todo_id]}

    def post(self, todo_id):
        todos[todo_id] = request.form['data']
        return {'tododododo'+str(todo_id): todos[todo_id]}

api.add_resource(TodoSimple, '/todo/<int:todo_id>')