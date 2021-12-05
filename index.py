import json
import logging
from flask import Flask, render_template, request

from game import Lobby

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
app = Flask(__name__)
L = Lobby()


@app.route('/')
def main():
    return render_template('duet.html')


CMD_DICT = {
    'login': L.login,
    'ready': L.ready,
}


@app.route('/', methods=['POST'])
def work():
    if 'data' not in request.form:
        return {}
    data = json.loads(request.form['data'])
    if 'cmd' not in data or 'game_name' not in data or data['game_name'] != 'duet':
        return {}

    if data['cmd'] in CMD_DICT:
        return CMD_DICT[data['cmd']](data)
    return L.room_action(data)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=6969,
        debug=True,
    )
