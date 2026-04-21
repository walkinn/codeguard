// Deliberately vulnerable Flask app — used as the "Load Example" sample.

export const EXAMPLE_CODE = `import sqlite3
from flask import Flask, request, jsonify
import os

app = Flask(__name__)
API_KEY = "sk-proj-abc123realkey456"
DB_PASSWORD = "admin123"

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    result = conn.execute(query)
    user = result.fetchone()
    if user:
        return f"<h1>Welcome {username}</h1>"
    return "Invalid credentials"

@app.route('/search')
def search():
    q = request.args.get('q')
    return f"<div>Results for: {q}</div>"

@app.route('/run')
def run_command():
    cmd = request.args.get('cmd')
    result = os.popen(cmd).read()
    return result

@app.route('/data')
def get_data():
    user_input = request.args.get('filter')
    data = eval(user_input)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
`;

export const EXAMPLE_LANGUAGE = 'python';
