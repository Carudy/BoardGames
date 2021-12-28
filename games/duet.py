import random
from itertools import product

from .util import *


class PlayerDuet:
    def __init__(self, name):
        self.uid = ''
        self.rid = 0
        self.name = name
        self.beat = time.time()
        self.ready = 0
        self.playing = 0
        self.type = 0
        self.guessed = set()


class RoomDuet(RoomBase):
    def __init__(self, rid, root):
        super().__init__(rid, root)
        self.words = list(
            set(filter(len, open(self.root.base_path / 'static/words.txt', encoding='utf-8').read().split(' '))))
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
        self.has_hint = 0
        self.quick_words = ['油锅里煮豆腐——越煮越燥', '火烧到额头——迫在眉睫', '吃了秦椒烤火——里外发烧', '五内如焚', '椅子底下着火——烧着屁股燎着心', '心焦火燎',
                            '火烧火燎', '急着吃饭呢']
        self.good_words = ['太棒棒', '飞机上挂茶壶——水瓶(平)高', '冰雪聪明', '肚子里怀了个地图——知晓天下事', '兰质蕙心', '脱了毛的鞋刷子——有板有眼',
                           '瞎子打拳——手法熟',
                           '聪明一世', '善解人意']
        self.fuck_words = ['???', '白昼见鬼', '¿', '离大谱', '擀面杖吹火——窍不通', '放风筝断了线——没指望了', '东洋人戴高帽——假充大个',
                           '人贵有自知之明', 'So common but confident!', 'What r u doing?']

    @property
    def hinter(self):
        res = self.round & 1
        return res if self.check_done(res) == False else res ^ 1

    def get_player(self, uid):
        return self.root.players[uid]

    def add_say_fuck(self, data):
        fuck_word = random.choice(self.fuck_words)
        self.shit_say(f'{self.get_player(data["uid"]).name}表示：{fuck_word}')
        return {'res': 0}

    def add_say_good(self, data):
        good_word = random.choice(self.good_words)
        self.shit_say(f'哇! {self.get_player(data["uid"]).name}觉得您真是{good_word}呢！')
        return {'res': 0}

    def add_say_shit(self, data):
        quick_word = random.choice(self.quick_words)
        self.shit_say(f'求求你GKD吧! {self.get_player(data["uid"]).name}已经等得{quick_word}了！')
        return {'res': 0}

    def shit_say(self, cont):
        self.chat.append(('shit', cont))

    def ask_info(self, data):
        if self.playing:
            rival = self.inroom[1 if self.inroom[0] == data['uid'] else 0]
            return {
                'playing': self.playing,
                'round': self.round,
                'type': self.get_player(data['uid']).type,
                'cards': self.cards,
                'coin': self.coin,
                'hinter': self.hinter,
                'green': self.green[self.get_player(data['uid']).type],
                'black': self.black[self.get_player(data['uid']).type],
                'grid': self.card_status,
                'rival': self.get_player(rival).name,
                'hints': '<br/>'.join(': '.join(i[1:]) for i in self.hints),
            }
        return {
            'playing': self.playing,
        }

    def start_game(self):
        n, m = len(self.inroom), len([w for w in self.inroom if self.get_player(w).ready == 1])
        print('Try to start game. {} / {}'.format(m, n))
        if n < 2:
            return
        if n == m == 2:
            print('Game start.')
            self.playing = 1
            # turn
            self.get_player(self.inroom[0]).type ^= 1
            self.get_player(self.inroom[1]).type = self.get_player(self.inroom[0]).type ^ 1
            self.get_player(self.inroom[0]).guessed = set()
            self.get_player(self.inroom[1]).guessed = set()
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

    def stop_game(self, win=False):
        print(f'Room {self.rid} game end.')
        self.coin = 0
        self.playing = 2 if win else 0
        for u in self.inroom:
            self.get_player(u).ready = 0

    def give_hint(self, data):
        if self.get_player(data['uid']).type != self.hinter:
            return {'res': 0, 'msg': 'not hinter'}
        self.hint = [data['word'], data['num']]
        if self.hints and data['uid'] == self.hints[-1][0] and (not self.check_done(self.hinter ^ 1)):
            return {'res': 0, 'msg': 'has hinted'}
        self.hints.append((data['uid'], data['word'], str(data['num'])))
        self.dy_say(f'{self.get_player(data["uid"]).name} 给了提示： {data["word"]}, {data["num"]}')
        print(f'{self.get_player(data["uid"]).name} 提示： {data["word"]}, {data["num"]}')
        return {'res': 0}

    def check_done(self, x):
        return sum([1 for pos in self.green[x] if self.card_status[pos[0] * 5 + pos[1]] in [1, 3]]) >= 9

    def nomore(self, data):
        if self.get_player(data['uid']).type == self.hinter:
            return {'res': 0}
        if (not self.hint[0]) or (self.gn == 0):
            return {'res': 3}
        self.round += 1
        self.gn = 0
        self.hint = ['', 0]
        self.dy_say(f'{self.get_player(data["uid"]).name} 怂了，选择跳过')
        return {'res': 1}

    def guess(self, data):
        if self.get_player(data['uid']).type == self.hinter:
            return {'res': 0}
        if not self.hint[0]:
            return {'res': 3}
        pos = data['pos']
        pos = (pos[0], pos[1])
        if pos in self.get_player(data['uid']).guessed:
            return {'res': 2}
        self.gn += 1
        self.get_player(data['uid']).guessed.add(pos)
        x = pos[0] * 5 + pos[1]
        print(f'{self.get_player(data["uid"]).name} guess {self.cards[x]}')
        o_say = f'{self.get_player(data["uid"]).name} 猜了：{self.cards[x]}, '
        rival = self.get_player(data["uid"]).type ^ 1

        if pos in self.black[rival]:
            self.dy_say(o_say + '是刺客！GG！')
            self.stop_game()
            return {'res': 1}

        elif pos not in self.green[rival]:
            self.dy_say(o_say + '猜错了！')
            self.round += 1
            self.gn = 0
            if self.round >= 9:
                self.dy_say(o_say + '回合用尽！失败！')
                self.stop_game()
                return {'res': 0}
            self.hint = ['', 0]
            self.card_status[x] = 2 if rival else 4
            return {'res': 0}

        else:
            self.card_status[x] = 1 if rival else 3
            self.dy_say(o_say + '猜对了，可以继续猜！')
            self.coin += 1
            if self.coin >= 15:
                self.dy_say(o_say + '胜利！')
                self.stop_game(win=True)
                return {'res': 9}
            if self.check_done(rival):
                nm = self.get_player(data["uid"]).name
                self.dy_say(o_say + f'{nm} 猜出了所有词！剩下由{nm}来给提示！')
            return {'res': 0}
