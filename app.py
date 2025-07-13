
from flask import Flask, render_template, request
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "mistralai/mistral-7b-instruct"  # o el que elijas (puede ser gpt-4, llama3, mixtral, etc.)
TEMPERATURE = 0.7
API_KEY = os.getenv("OPENROUTER_API_KEY")

@app.route("/", methods=["GET", "POST"])
def index():
    reply = ""
    if request.method == "POST":
        user_input = request.form["user_input"]
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "Eres HEO, un asistente divertido y empático que ayuda a elegir hamburguesas temáticas."},
                {"role": "user", "content": user_input}
            ],
            "temperature": TEMPERATURE
        }
        try:
    response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
    data = response.json()
    if "choices" in data:
        reply = data["choices"][0]["message"]["content"]
    else:
        reply = f"⚠️ Error: {data.get('error', 'Sin campo choices en la respuesta')}"
except Exception as e:
    reply = f"⚠️ Excepción en la respuesta: {str(e)}"

if __name__ == "__main__":
    app.run(debug=True)
