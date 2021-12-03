import json
from flask import Flask, render_template, request

from game import GameRoom

app = Flask(__name__)
G = GameRoom()

@app.route('/')
def main():
    return render_template('duet.html')


@app.route('/', methods=['POST'])
def work():
    if 'data' not in request.form:
        return None
    data = json.loads(request.form['data'])
    if 'cmd' not in data or 'game_name' not in data or data['game_name'] != 'duet':
        return None
    if 'uid' in data and (G.players[data['uid']] is None):
        return None
    if data['cmd'] == 'reg':
        return G.add_player(data)

    elif data['cmd'] == 'beat':
        return G.beat(data['uid'])

    elif data['cmd'] == 'say':
        return G.add_say(data['uid'], data['cont'])

    elif data['cmd'] == 'ask_chat':
        return G.ask_say(data['from'])

    elif data['cmd'] == 'info':
        return G.ask_info(data['uid'])

    elif data['cmd'] == 'ready':
        return G.player_ready(data['uid'])

    elif data['cmd'] == 'guess':
        return G.guess(data['uid'], data['pos'])

    elif data['cmd'] == 'hint':
        return G.give_hint(data['uid'], data['word'], data['num'])

    elif data['cmd'] == 'nomore':
        return G.nomore(data['uid'])


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=6969,
        debug=True,
    )