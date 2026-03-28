from flask import Flask, render_template, jsonify, request
import requests
import json
from datetime import datetime

app = Flask(__name__)

BACKEND_URL = "http://localhost:8000"

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/events')
def get_events():
    try:
        response = requests.get(f"{BACKEND_URL}/events")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch events"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/medication', methods=['GET'])
def get_medication():
    try:
        response = requests.get(f"{BACKEND_URL}/settings/medication")
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to fetch medication settings"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/medication', methods=['POST'])
def set_medication():
    try:
        data = request.get_json()
        response = requests.post(
            f"{BACKEND_URL}/settings/medication",
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to update medication settings"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)