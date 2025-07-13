from flask import Flask, render_template, request
import requests
import os
from dotenv import load_dotenv

# === Cargar entorno ===
load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    raise EnvironmentError("❌ API KEY no encontrada. Configura OPENROUTER_API_KEY en el entorno.")

# === Configuración de OpenRouter ===
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"


headers = {
   "Authorization": f"Bearer {api_key}",
   "Content-Type": "application/json",
   "HTTP-Referer": "https://heosync.cl",  # o tu dominio real
   "X-Title": "HEO Sync Ventas"

}

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    heo_response = ""
    if request.method == "POST":
        user_input = request.form["user_input"]
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "Eres HEO Sync, un asistente de ventas empático y creativo que recomienda productos, escucha al cliente y guía hacia lo más vendido según su ánimo o idea."},
                {"role": "user", "content": user_input}
            ]
        }

        try:
            response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload)
            data = response.json()
            print(f"🟢 Pregunta enviada: {user_input}")

            message = data.get("choices", [{}])[0].get("message", {}).get("content")
            heo_response = message if message else "⚠️ La IA no devolvió contenido."
        except Exception as e:
            heo_response = f"⚠️ Excepción: {str(e)}"

    return render_template("index.html", reply=heo_response)

if __name__ == "__main__":
    app.run(debug=True)
