from flask import Flask, render_template, request, redirect, url_for, jsonify, abort
import os, requests, json, urllib.parse
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("HEO_MODEL", "mistralai/mistral-7b-instruct")

# --- Seguridad simple para admin (token por query) ---
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")  # ponlo en Render > Environment

def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if ADMIN_TOKEN and request.args.get("token") != ADMIN_TOKEN:
            abort(403)
        return f(*args, **kwargs)
    return wrapper

app = Flask(__name__)

def build_codex_messages(user_msg: str):
    system = (
        "Eres HEO Sync Ventas de The Best Burger (TBB). "
        "Aplica Método Códex y Neuroventa 2.0: claridad → escasez ligera → prueba social → elección guiada. "
        "Ancla emocional: pan batido criollo de Valparaíso. "
        "Tono: directo, humor inteligente, motivador; español Chile. "
        "No inventes precios ni descuentos. Cierra SIEMPRE con CTA: "
        "WhatsApp +56 9 6861 1939 / Retiro Portal TBB / QR Kyte. "
        "Máximo 4 líneas."
    )
    prompt = f"""[USUARIO]
{user_msg}

[FORMATO]
- 2–4 líneas máximo.
- 1 opción principal + 1 alternativa.
- Menciona pan batido si aplica.
- Cierra con CTA claro (WhatsApp/Portal/QR)."""
    return [{"role":"system","content":system},{"role":"user","content":prompt}]

def heo_complete(user_msg: str) -> str:
    if not OPENROUTER_API_KEY:
        return ("(Offline) Anda por la Shenlong Smash en pan batido. "
                "Alternativa: Clásica con cheddar. Pide por WhatsApp +56 9 6861 1939 "
                "o retira en el Portal TBB.")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://heosync.cl",
        "X-Title": "HEO Sync Ventas"
    }
    try:
        r = requests.post(OPENROUTER_API_URL, headers=headers, json={
            "model": MODEL,
            "messages": build_codex_messages(user_msg),
            "temperature": 0.6
        }, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data.get("choices",[{}])[0].get("message",{}).get("content","").strip() or "⚠️ La IA no devolvió contenido."
    except Exception as e:
        return f"⚠️ Error IA: {e}"

def load_json(path:str):
    with open(path,"r",encoding="utf-8") as f: return json.load(f)

def save_json(path:str, payload:dict):
    with open(path,"w",encoding="utf-8") as f: json.dump(payload,f,ensure_ascii=False,indent=2)

# ---------------- Rutas públicas ----------------

@app.route("/", methods=["GET"])
def pantalla_bienvenida():
    return render_template("index.html")

@app.route("/chat", methods=["GET","POST"])
def chat_geo():
    reply = ""
    if request.method == "POST":
        user_input = request.form.get("user_input","").strip()
        if user_input:
            reply = heo_complete(user_input)
    return render_template("chat.html", reply=reply)

@app.route("/pedido", methods=["GET","POST"])
def flujo_pedido():
    menu = load_json("data/mock_menu.json")
    if request.method == "POST":
        datos = request.form.to_dict()
        producto = datos.get("producto","Burger TBB")
        extras   = datos.get("extras","sin extras")
        entrega  = datos.get("entrega","retiro")
        direccion= datos.get("direccion","Portal TBB")
        resumen = f"Pedido: {producto} + {extras} / Entrega: {entrega} / Dirección: {direccion}"
        texto = urllib.parse.quote(resumen)
        return redirect(f"https://wa.me/56968611939?text={texto}")
    return render_template("pedido.html", menu=menu)

@app.route("/tarjeta", methods=["GET","POST"])
def tarjeta_fidelizacion():
    st = load_json("data/mock_loyalty.json")
    msg = ""
    if request.method == "POST":
        codigo = request.form.get("codigo","").strip()
        if codigo in st["codigos_validos"]:
            st["sellos"] = min(st["sellos"]+1, st["meta"])
            msg = "Sello agregado."
        else:
            msg = "Código inválido."
        save_json("data/mock_loyalty.json", st)
    return render_template("tarjeta.html", st=st, msg=msg)

@app.route("/juegos")
def juegos_retro():
    return render_template("juegos.html")

@app.route("/codex", methods=["GET","POST"])
def modulo_codex():
    resumen = None
    if request.method == "POST":
        problema = request.form.get("problema","").strip()
        p = [request.form.get(f"p{i}","").strip() for i in range(1,6)]
        bullets = "".join([f"<li>{x}</li>" for x in p if x])
        resumen = f"""
        <h4>Resumen accionable</h4>
        <ul>{bullets}</ul>
        <p><strong>Próxima acción:</strong> {request.form.get('accion','Definir')}</p>
        <p><strong>Métrica de éxito:</strong> {request.form.get('metrica','Ventas día')}</p>
        """
    return render_template("codex.html", resumen=resumen)

# ---------------- Admin (protegido) ----------------

@app.route("/admin/dashboard")
@require_admin
def dashboard_operador():
    ventas = load_json("data/mock_ventas.json")
    return render_template("dashboard.html", ventas=ventas)

# API pública/privada según decidas después
@app.get("/api/ventas-dia")
def api_ventas_dia():
    return jsonify(load_json("data/mock_ventas.json"))

# ---------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
