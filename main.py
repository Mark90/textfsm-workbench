from datetime import datetime
from io import StringIO
import json

from flask import Flask, render_template
from flask_sockets import Sockets
import textfsm

PORT = 5001

app = Flask(__name__)
sockets = Sockets(app)


def parse_textfsm(data, template):
    """Given input data and TextFSM template, return tuple of parsing result
    and created regexes."""
    fsm = textfsm.TextFSM(StringIO(template.strip()))
    regexes = ''.join(f'{rule.line_num:3} {state:15} {rule.regex}\n'
                      for state, rules in fsm.states.items() for rule in rules)
    records = fsm.ParseText(data.strip())
    return [dict(zip(fsm.header, record)) for record in records], regexes


@sockets.route('/parser')
def parser(conn):
    while not conn.closed:
        error = parsed = regexes = None
        raw = conn.receive()
        if raw is None:
            continue
        timestamp = datetime.now().strftime('%T')
        try:
            message = json.loads(raw)
            parsed, regexes = parse_textfsm(message['data'], message['template'])
        except (TypeError, ValueError) as e:
            error = f'Invalid JSON "{e}"'
        except (KeyError, textfsm.Error) as e:
            error = str(e)
        conn.send(json.dumps({'ts': timestamp, 'error': error, 'parsed': parsed, 'regexes': regexes}))


@app.route('/')
def index():
    return render_template('index.html', port=PORT)


if __name__ == "__main__":
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    print(f'Navigate to http://127.0.0.1:{PORT} in your browser.')
    server = pywsgi.WSGIServer(('', PORT), app, handler_class=WebSocketHandler)
    server.serve_forever()
