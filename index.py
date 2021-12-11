import json
import logging
from flask import Flask, render_template, request

from games import *

_log = logging.getLogger('werkzeug')
_log.setLevel(logging.ERROR)
app = Flask(__name__)
duet_lobby = LobbyDuet()

CMD_DICT = {
    'login': duet_lobby.login,
    'ready': duet_lobby.ready,
}

GAMES = {'duet', 'draw'}


@app.route('/<name>')
def main(name):
    if name in GAMES:
        return render_template(f'{name}.html')


@app.route('/', methods=['POST'])
def work():
    if 'data' not in request.form:
        return {}
    data = json.loads(request.form['data'])
    if 'cmd' not in data or 'game_name' not in data or data['game_name'] != GAMES:
        return {}

    if data['cmd'] in CMD_DICT:
        return CMD_DICT[data['cmd']](data)
    return duet_lobby.room_action(data)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=6969,
        debug=True,
    )
