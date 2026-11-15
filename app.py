import os
import logging
import json
import random
import string
import pymysql
from flask import Flask, render_template, request, redirect, url_for, Blueprint, session

# Define BASE_DIR
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
# app.secret_key = "your_secret_key_here"  # Required for session
app.secret_key = os.environ.get("SECRET_KEY", "your_secret_key_here")



# Database settings. The password is NOT written here - it comes from the environment.
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "shivamportfolio.mysql.pythonanywhere-services.com"),
    "user": os.environ.get("DB_USER", "shivamportfolio"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "shivamportfolio$Test"),
    "charset": "utf8mb4",
    "connect_timeout": 5,   # a slow database must never hang the CAPTCHA page
    "read_timeout": 5,
    "write_timeout": 5,
}

MAX_META_BYTES = 20000  # ignore an oversized device_meta field






# Load data from JSON files
def load_json(filename):
    file_path = os.path.join(BASE_DIR, 'data', filename)
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.error(f"File not found: {file_path}")
        return {}
    except json.JSONDecodeError:
        logging.error(f"Invalid JSON in file: {file_path}")
        return {}

# Load data
projects = load_json('projects.json')
skills = load_json('skills.json')
tech_stack = load_json('tech_stack.json')





# ========================================================================Newly Added============================================
# ========================================================================Newly Added============================================


def get_db_connection():
    # A fresh connection per save. PythonAnywhere's MySQL closes idle connections after
    # 5 minutes, so reusing one connection would randomly fail ("server has gone away").
    return pymysql.connect(**DB_CONFIG)


def _get(data, *path):
    """Safely read data["a"]["b"]... and return None if anything is missing or not a dict."""
    for key in path:
        if not isinstance(data, dict):
            return None
        data = data.get(key)
    return data


def _text(value, length):
    return value[:length] if isinstance(value, str) else None


def _int(value, low=0, high=2147483647):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        number = int(value)          # NaN / Infinity raise here
    except (ValueError, OverflowError):
        return None
    return number if low <= number <= high else None


def _float(value, low=0.0, high=999999.0):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    try:
        number = float(value)
    except (ValueError, OverflowError):
        return None
    if number != number or not (low <= number <= high):   # NaN or out of range
        return None
    return round(number, 2)


def _bool(value):
    return int(value) if isinstance(value, bool) else None


def _client_ip():
    # PythonAnywhere's load balancer puts the real visitor IP in X-Real-IP
    # (request.remote_addr would only show the load balancer).
    return (request.headers.get("X-Real-IP") or request.remote_addr or "")[:45] or None


def save_visit(captcha_passed):
    """
    Save one row for this CAPTCHA attempt (call it only from the POST branch).
    The browser data in "device_meta" is untrusted, so every value is type-checked and clipped.
    This function never raises: if the database is down, the visitor is not affected.
    """
    try:
        # ---- device details sent by the page (hidden field, JSON) ----
        raw = request.form.get("device_meta", "")
        client = {}
        if raw and len(raw) <= MAX_META_BYTES:
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    client = parsed
            except ValueError:
                pass

        languages = _get(client, "browser", "languages")
        languages_list = (
            ", ".join(x for x in languages if isinstance(x, str))[:255]
            if isinstance(languages, list) else None
        )

        brands = _get(client, "clientHints", "brands")
        ch_brands = (
            ", ".join(
                f"{b.get('brand')} {b.get('version')}" for b in brands if isinstance(b, dict)
            )[:512]
            if isinstance(brands, list) else None
        )

        hint_headers = {
            k: v for k, v in request.headers.items() if k.lower().startswith("sec-ch-ua")
        }

        battery = _get(client, "battery")   # a dict, or the text "unavailable"

        row = {
            "captcha_passed": 1 if captcha_passed else 0,

            # seen by the server
            "ip_address": _client_ip(),
            "user_agent": _text(request.headers.get("User-Agent"), 512),
            "accept_language": _text(request.headers.get("Accept-Language"), 255),
            "referer": _text(request.headers.get("Referer"), 512),

            # sent by the browser
            "page_url": _text(_get(client, "page", "url"), 512),
            "timezone_name": _text(_get(client, "time", "timezone"), 64),
            "utc_offset_min": _int(_get(client, "time", "utcOffsetMinutes"), -1440, 1440),
            "browser_language": _text(_get(client, "browser", "language"), 32),
            "languages_list": languages_list,
            "nav_platform": _text(_get(client, "browser", "platform"), 64),
            "nav_vendor": _text(_get(client, "browser", "vendor"), 64),
            "cookies_enabled": _bool(_get(client, "browser", "cookiesEnabled")),
            "do_not_track": _text(_get(client, "browser", "doNotTrack"), 16),
            "automated": _bool(_get(client, "browser", "automated")),

            "screen_width": _int(_get(client, "screen", "width")),
            "screen_height": _int(_get(client, "screen", "height")),
            "avail_width": _int(_get(client, "screen", "availWidth")),
            "avail_height": _int(_get(client, "screen", "availHeight")),
            "color_depth": _int(_get(client, "screen", "colorDepth"), 0, 32767),
            "pixel_ratio": _float(_get(client, "screen", "pixelRatio"), 0, 99.99),
            "orientation": _text(_get(client, "screen", "orientation", "type"), 32),
            "viewport_width": _int(_get(client, "viewport", "width")),
            "viewport_height": _int(_get(client, "viewport", "height")),

            "cpu_cores": _int(_get(client, "hardware", "cpuCores"), 0, 32767),
            "device_memory_gb": _float(_get(client, "hardware", "deviceMemoryGB"), 0, 999),
            "max_touch_points": _int(_get(client, "hardware", "maxTouchPoints"), 0, 32767),

            "is_online": _bool(_get(client, "network", "online")),
            "net_type": _text(_get(client, "network", "type"), 32),
            "net_effective_type": _text(_get(client, "network", "effectiveType"), 16),
            "net_downlink_mbps": _float(_get(client, "network", "downlinkMbps")),
            "net_rtt_ms": _int(_get(client, "network", "rttMs")),
            "save_data": _bool(_get(client, "network", "saveData")),

            "color_scheme": _text(_get(client, "preferences", "colorScheme"), 8),
            "reduced_motion": _bool(_get(client, "preferences", "reducedMotion")),
            "pointer_type": _text(_get(client, "preferences", "pointer"), 8),

            # battery stays NULL on browsers without the Battery API (Safari, Firefox, iPhone)
            "battery_percent": _int(_get(battery, "levelPercent"), 0, 100),
            "battery_charging": _bool(_get(battery, "charging")),
            "battery_charging_time_sec": _int(_get(battery, "chargingTimeSec")),
            "battery_discharging_time_sec": _int(_get(battery, "dischargingTimeSec")),

            "ch_brands": ch_brands,
            "ch_mobile": _bool(_get(client, "clientHints", "mobile")),
            "ch_platform": _text(_get(client, "clientHints", "platform"), 32),
            "ch_model": _text(_get(client, "clientHints", "details", "model"), 64),
            "ch_platform_version": _text(_get(client, "clientHints", "details", "platformVersion"), 32),
            "ch_architecture": _text(_get(client, "clientHints", "details", "architecture"), 16),

            "time_on_page_ms": _int(_get(client, "session", "timeOnPageMs")),

            "raw_client_json": json.dumps(client) if client else None,
            "client_hint_headers": json.dumps(hint_headers) if hint_headers else None,
        }

        # Column names above are fixed in this file (not user input); the values are
        # passed as parameters, so the query is safe from SQL injection.
        columns = ", ".join(row.keys())
        placeholders = ", ".join(["%s"] * len(row))
        sql = f"INSERT INTO visitor_logs ({columns}) VALUES ({placeholders})"

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(sql, list(row.values()))
            conn.commit()
        finally:
            conn.close()

    except Exception:
        logging.exception("Could not save visitor details")




# __________________________________________________________________________________________________________________________--




def generate_captcha():
    """Generate a complex CAPTCHA with words, symbols, and numbers"""
    words = ["apple", "orange", "banana", "grape", "melon", "pear", "cherry"]
    symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?/`~"
    captcha_parts = []

    for _ in range(3):
        word = random.choice(words)
        # Randomly capitalize letters
        word = ''.join(random.choice([char.upper(), char.lower()]) for char in word)
        symbol = random.choice(symbols)
        number = str(random.randint(10, 99))
        captcha_parts.append(f"{symbol}{word}{number}")

    return " ".join(captcha_parts)

@app.route('/', methods=['GET', 'POST'])
def index():
    # Check if user has already passed the CAPTCHA
    if session.get('captcha_passed'):
        # User has passed CAPTCHA, show the main page
        return render_template('index.html',
                              projects=projects,
                              skills=skills,
                              tech_stack=tech_stack)
    else:
        # User hasn't passed CAPTCHA yet
        if request.method == 'POST':
            # User is submitting CAPTCHA answer
            user_answer = request.form.get('captcha_answer', '').strip().lower()
            correct_answer = ' '.join(session.get('captcha_words', [])).lower()
            if user_answer == correct_answer:
                save_visit(True)                                   # <-- ADD
                # CAPTCHA passed
                session['captcha_passed'] = True
                return redirect(url_for('index'))
            else:
                save_visit(False)                                  # <-- ADD
                # CAPTCHA failed, generate a new one
                captcha = generate_captcha()
                session['captcha_words'] = captcha.split()
                return render_template('captcha.html',
                                      captcha=captcha,
                                      error="Incorrect CAPTCHA, please try again")
        else:
            # Initial GET request, show CAPTCHA
            captcha = generate_captcha()
            session['captcha_words'] = captcha.split()
            return render_template('captcha.html', captcha=captcha)


@app.route('/projects/<project_id>')
def project_detail(project_id):
    # In a real app, you'd fetch the specific project from database
    # Here we're just passing a placeholder
    project = next((p for p in projects if p['link'] == f'/projects/{project_id}'), None)
    if project:
        return render_template('project_detail.html', project=project)
    return redirect(url_for('index'))


from google_sheets import send_to_google_sheets
@app.route('/contact', methods=['POST'])
def contact():
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            message = request.form.get('message')

            logging.info(f"Received form data - Name: {name}, Email: {email}")

            # Send data to Google Sheets
            result = send_to_google_sheets(name, email, message)
            logging.info(f"Google Sheets result: {result}")

            # Check if the submission was successful
            if result and result.get("result") == "Success":
                return render_template('thank_you.html', name=name)
            else:
                # Handle error - properly extract the error message
                error_message = result.get("message", result.get("error", "Unknown error"))
                logging.error(f"Error from Google Sheets: {error_message}")
                return render_template('error.html', error=error_message), 500

        except Exception as e:
            logging.exception("Unexpected error in contact route")
            return render_template('error.html', error=str(e)), 500

    return redirect(url_for('index'))


# bandana box
# @app.route('/bbox', methods=['GET'])
# def box():
#     return render_template('bbox.html')

if __name__ == '__main__':
    app.run(debug=True)
