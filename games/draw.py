from .util import *


class PlayerDraw:
    def __init__(self, name):
        self.uid = ''
        self.rid = 0
        self.score = 0


class RoomDraw(RoomBase):
    def __init__(self, rid, root):
        super().__init__(rid, root)
        self.max_player = 6
        self.lines = []

    @property
    def painter(self):
        i = self.round % len(self.inroom)
        return self.inroom[i]

    def get_lines(self, data):
        self.lines += data['lines']
        return {'res': 0}

    def ask_line(self, data):
        i = data['from']
        return {'res': 0, 'lines': self.lines[i:i + 10]}

    def ask_info(self, data):
        ret = {
            'playing': self.playing,
            'inroom': [{'name': self[uid].name, 'score': self[uid].score} for uid in self.inroom],
        }
        if self.playing:
            ret.update({
                'round': self.round,
                'painter': self.painter,
            })
        return ret

    def start_game(self):
        if len(self.inroom) < 1:
            return {'res': 1, 'msg': 'not enough player'}
        if self.playing:
            return {'res': 1, 'msg': 'already playing'}
        self.round += 1
        self.playing = 1
        return {'res': 0}
