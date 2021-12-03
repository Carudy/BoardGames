from collections import defaultdict
import time
import random
from itertools import product


class Player:
    def __init__(self, name):
        self.uid = ''
        self.name = name
        self.beat = time.time()
        self.ready = 0
        self.type = 0
        self.guessed = set()


class GameRoom:
    def __init__(self):
        self.now = 0
        self.players = defaultdict(lambda: None)
        self.chat = []
        self.playing = 0
        self.n_round = 0  # game round
        self.words = list(set(filter(len, open('words', encoding='utf-8').read().split(' '))))
        random.shuffle(self.words)
        self.points = list(product(range(5), range(5)))
        self.coin = self.round = 0
        self.cards = []
        self.green = []
        self.black = []
        self.ok = [0, 0]
        self.card_status = []
        self.hint = ['', 0]
        self.gn = 0
        self.hints = []

    @property
    def hinter(self):
        res = self.round & 1
        return res if self.check_done(res) == False else res ^ 1

    @property
    def alives(self):
        self.clean()
        res = [u for u in self.players if self.players[u]]
        return res

    @property
    def alives_name(self):
        return [self.players[u].name for u in self.alives]

    def clean(self):
        ima = time.time()
        for u in self.players:
            if self.players[u] and (abs(ima - self.players[u].beat) > 24):
                print('Die: {}, {}; beat: {}'.format(u, self.players[u].name, abs(ima - self.players[u].beat)))
                self.players[u] = None

    def beat(self, uid):
        if not self.players[uid]: return {'res': 'dead'}
        self.players[uid].beat = time.time()
        # print('{} new beat: {}'.format(self.players[uid].name, self.players[uid].beat))
        return {'res': 'ok'}

    def add_player(self, data):
        if len(self.alives) >= 2: return {'uid': -1}
        if data['name'] in self.alives_name: return {'uid': -2}
        self.now += 1
        self.players[self.now] = Player(data['name'])
        print('New player: ', self.now, self.players[self.now].name)
        return {'uid': self.now}

    def add_say(self, uid, cont):
        print('Add speak: ', self.players[uid].name, cont)
        self.chat.append((self.players[uid].name, cont))
        return {'res': 0}

    def dy_say(self, cont):
        self.chat.append(('', cont))

    def ask_say(self, x):
        if x >= len(self.chat): return {'n': 0}
        return {'n': len(self.chat) - x, 'data': self.chat[x:]}

    def ask_info(self, uid):
        users = self.alives
        if self.playing == 1 and len(users) < 2:
            self.stop_game()
            return {'playing': 0, }

        if self.playing:
            rival = self.ab[1 if self.ab[0] == uid else 0]
            return {
                'playing': self.playing,
                'round': self.round,
                'type': self.players[uid].type,
                'cards': self.cards,
                'coin': self.coin,
                'hinter': self.hinter,
                'green': self.green[self.players[uid].type],
                'black': self.black[self.players[uid].type],
                'grid': self.card_status,
                'rival': self.players[rival].name,
                'hints': '；  '.join(':'.join(i) for i in self.hints),
            }
        return {
            'playing': self.playing,
        }

    def start_game(self):
        users = self.alives
        n, m = len(users), len([w for w in users if self.players[w].ready == 1])
        print('Try to start game. {} / {}'.format(m, n))
        if n < 2: return
        if n == m == 2:
            print('Game start.')
            self.n_round += 1
            self.playing = 1
            # turn
            self.ab = users
            self.players[users[0]].type ^= 1
            self.players[users[1]].type = self.players[users[0]].type ^ 1
            self.players[users[0]].guessed = set()
            self.players[users[1]].guessed = set()
            self.round = 0
            self.ok = [0, 0]
            self.hints = []
            # cards
            t0, t1 = self.words[:25], self.words[25:]
            random.shuffle(t1)
            self.words = t1 + t0
            self.cards = self.words[:25]
            random.shuffle(self.points)
            self.green = [self.points[:9], self.points[6:15]]
            self.black = [random.sample(self.points[9:], 3), random.sample(self.points[:6] + self.points[15:], 3)]
            self.card_status = [0] * 25
            # print(self.ab)
            # print(self.cards)            
            # print(self.green)            
            # print(self.black)

    def stop_game(self):
        self.playing = self.coin = 0
        for u in self.alives: self.players[u].ready = 0
        # self.chat = []

    def player_ready(self, uid):
        if self.playing != 0: return {'res': 1}
        print('{} get ready.'.format(self.players[uid].name))
        self.players[uid].ready = 1
        self.start_game()
        return {'res': 0}

    def give_hint(self, uid, word, num):
        if self.players[uid].type != self.hinter: return {'res': 0}
        self.hint = [word, num]
        self.hints.append([word, str(num)])
        self.dy_say('{} 给了提示： {}, {}'.format(self.players[uid].name, word, num))
        print('{} 提示： {}, {}'.format(self.players[uid].name, word, num))
        return {'res': 0}

    def check_done(self, x):
        return sum([1 for pos in self.green[x] if self.card_status[pos[0] * 5 + pos[1]] in [1, 3]]) >= 9

    def nomore(self, uid):
        if self.players[uid].type == self.hinter: return {'res': 0}
        if (not self.hint[0]) or (self.gn == 0): return {'res': 3}
        self.round += 1
        self.gn = 0
        self.hint = ['', 0]
        self.dy_say('{} 怂了，选择跳过'.format(self.players[uid].name))
        return {'res': 1}

    def guess(self, uid, pos):
        if self.players[uid].type == self.hinter: return {'res': 0}
        if not self.hint[0]: return {'res': 3}
        pos = (pos[0], pos[1])
        if pos in self.players[uid].guessed: return {'res': 2}
        self.gn += 1
        self.players[uid].guessed.add(pos)
        x = pos[0] * 5 + pos[1]
        print('{} guess {}'.format(self.players[uid].name, self.cards[x]))
        o_say = '{} 猜了：{}, '.format(self.players[uid].name, self.cards[x])
        t = self.players[uid].type ^ 1

        if pos in self.black[t]:
            self.dy_say(o_say + '是刺客！GG！')
            self.stop_game()
            return {'res': 1}

        elif pos not in self.green[t]:
            self.dy_say(o_say + '猜错了！')
            self.round += 1
            self.gn = 0
            if self.round >= 9:
                self.dy_say(o_say + '回合用尽！失败！')
                self.stop_game()
                return {'res': 0}
            self.hint = ['', 0]
            self.card_status[x] = 2 if t else 4
            return {'res': 0}

        else:
            self.card_status[x] = 1 if t else 3
            self.dy_say(o_say + '猜对了，可以继续猜！')
            self.coin += 1
            if self.coin >= 15:
                self.dy_say(o_say + '胜利！')
                self.stop_game()
                return {'res': 9}
            return {'res': 0}


class Lobby:
    def __init__(self):
        self.rooms = []
        self.players = defaultdict(lambda: None)
