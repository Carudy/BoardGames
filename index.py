import json
import logging
from flask import Flask, render_template, request

from games import *

_log = logging.getLogger('werkzeug')
_log.setLevel(logging.ERROR)
app = Flask(__name__)

GAMES = {'duet', 'draw'}
lobbys = {
    'duet': Lobby(name='duet', player_cls=PlayerDuet, room_cls=RoomDuet, cmd_dict={
        'say_shit': 'add_say_shit',
        'say_good': 'add_say_good',
        'say_fuck': 'add_say_fuck',
        'guess': 'guess',
        'hint': 'give_hint',
        'nomore': 'nomore',
    }),
    'draw': Lobby(name='draw', player_cls=PlayerDraw, room_cls=RoomDraw, cmd_dict={
        'new_lines': 'get_lines',
    }),
}


@app.route('/<name>')
def main(name):
    if name in GAMES:
        return render_template(f'{name}.html')
    return {}


@app.route('/', methods=['POST'])
def work():
    if 'data' not in request.form:
        return {'msg': 'no data'}
    data = json.loads(request.form['data'])
    if 'cmd' not in data or 'game_name' not in data or data['game_name'] not in GAMES:
        return {'msg': 'no cmd / wrong game'}
    if data['cmd'] in ['login', 'ready']:
        return getattr(lobbys[data['game_name']], data['cmd'])(data)
    return lobbys[data['game_name']].room_action(data)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=6969,
        debug=True,
    )
