import json
import platform
from datetime import datetime
from io import StringIO

import textfsm
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

BIND, HOST, PORT = "127.0.0.1", "127.0.0.1", 5001

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)


def parse_textfsm(data, template):
    """Given input data and TextFSM template, return tuple of parsing result
    and created regexes."""
    fsm = textfsm.TextFSM(StringIO(template.strip()))
    regexes = "".join(
        f"{rule.line_num:3} {state:15} {rule.regex}\n"
        for state, rules in fsm.states.items()
        for rule in rules
    )
    records = fsm.ParseText(data.strip())
    return [dict(zip(fsm.header, record)) for record in records], regexes


@app.route("/")
def index():
    return render_template(
        "index.html",
        port=PORT,
        host=HOST,
        versions=f"TextFSM {textfsm.__version__} Python {platform.python_version()}",
    )


@socketio.on("connect")
def test_connect():
    print("Client connected from {}".format(request.environ["REMOTE_ADDR"]))


@socketio.on("disconnect")
def test_disconnect():
    print("Client disconnected from {}".format(request.environ["REMOTE_ADDR"]))


@socketio.on("parse")
def test_parse(message):
    error = parsed = regexes = None
    timestamp = datetime.now().strftime("%T")
    try:
        parsed, regexes = parse_textfsm(message["data"], message["template"])
        parsed = json.dumps(parsed, indent=2)
    except (KeyError, textfsm.Error) as e:
        error = str(e)
    emit(
        "parse_response",
        {"error": error, "text": parsed, "regex": regexes, "ts": timestamp},
    )


if __name__ == "__main__":
    print(f"Starting on {BIND}:{PORT}")
    socketio.run(app, host=BIND, port=PORT)
