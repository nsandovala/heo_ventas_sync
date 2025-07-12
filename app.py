
from flask import Flask, render_template, request
import requests, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_URL")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL")
DEEPSEEK_TEMP = float(os.getenv("DEEPSEEK_TEMP"))
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
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": "Eres HEO, un asistente divertido y empático que ayuda a elegir hamburguesas temáticas."},
                {"role": "user", "content": user_input}
            ],
            "temperature": DEEPSEEK_TEMP
        }
        try:
            response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
            reply = response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            reply = f"Error en la respuesta: {e}"
    return render_template("index.html", reply=reply)

if __name__ == "__main__":
    app.run(debug=True)
