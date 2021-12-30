import random

from .util import *


class PlayerDraw:
    def __init__(self, name):
        self.uid = ''
        self.rid = 0
        self.done = 0
        self.score = 0
        self.chance = 3


class RoomDraw(RoomBase):
    def __init__(self, rid, root):
        super().__init__(rid, root)
        self.max_player = 6
        self.lines = []
        self.step = 512
        self.n_reset = 0
        self.puzzles = eval(open(self.root.base_path / 'static/puzzle.txt', encoding='utf-8').read())
        self.hint = ''
        self.ans = ''

    @property
    def painter(self):
        i = self.round % len(self.inroom)
        return self.inroom[i]

    def get_lines(self, data):
        self.lines += data['lines']
        return {'res': 0}

    def ask_lines(self, data):
        if data['uid'] != self.painter:
            i = data['from']
            if i >= len(self.lines):
                return {'res': 0, 'lines': []}
            return {'res': 0, 'lines': self.lines[i:i + self.step]}
        else:
            if data['from'] == 0:
                return {'res': 0, 'lines': self.lines}
            else:
                return {'res': 0, 'lines': []}

    def reset(self, data):
        self.lines = []
        self.n_reset += 1
        return {'res': 0}

    def ask_info(self, data):
        ret = {
            'playing': self.playing,
            'inroom': [{'name': self[uid].name, 'score': self[uid].score} for uid in self.inroom],
        }
        if self.playing:
            ret.update({
                'round': self.round,
                'painter': self.painter,
                'reset': self.n_reset,
            })
            if data['uid'] == self.painter:
                ret.update({'ans': self.ans})
            else:
                ret.update({
                    'hint': self.hint,
                    'chance': self[data['uid']].chance,
                })
        return ret

    def start_game(self):
        if len(self.inroom) < 2:
            return {'res': 1, 'msg': 'not enough player'}
        if self.playing:
            return {'res': 1, 'msg': 'Already playing!'}
        self.n_reset = -1
        self.reset({})
        self.round += 1
        self.playing = 1
        self.n_reset = 0
        self.hint = random.choice(list(self.puzzles.keys()))
        self.ans = random.choice(self.puzzles[self.hint])
        for uid in self.inroom:
            self[uid].done = 0
            self[uid].chance = 3
        print(f'{self.painter} draw {self.hint}: {self.ans}')
        self.dy_say(f'游戏开始，由{self.painter}画！')
        return {'res': 0}

    def guess(self, data):
        if self.playing and self.painter != data['uid'] and self[data['uid']].chance > 0:
            if data['ans'] == self.ans:
                self[data['uid']].score += 1
                self[self.painter].score += 1
                self[data['uid']].done = 1
                self.dy_say(f"{data['uid']} 猜对了！")
            else:
                self[data['uid']].chance -= 1
                if self[data['uid']].chance <= 0:
                    self[data['uid']].done = 1
                self.dy_say(f"{data['uid']} 猜错了！")
        n_done = len([i for i in self.inroom if self[i].done])
        if n_done == len(self.inroom) - 1:
            self.playing = 0
            self.dy_say(f'本局结束！下局尝试开始！')
            self.start_game()
        return {'res': 0}
