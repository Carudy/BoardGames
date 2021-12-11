import os
from collections import defaultdict
import time
from pathlib import Path


class Lobby:
    def __init__(self, name, player_cls, room_cls):
        self.name = name
        self.player_cls = player_cls
        self.room_cls = room_cls
        self.rooms = defaultdict(lambda: None)
        self.players = defaultdict(lambda: None)
        self.base_path = Path(os.path.dirname(__file__)).parent
        self.accounts = eval((self.base_path / 'static/users').open(encoding='utf-8').read())
        students = eval((self.base_path / 'static/students.txt').open(encoding='utf-8').read())
        for stu in students:
            self.accounts[stu] = stu
        self.cmd_dict = None

    def login(self, data):
        if data['uid'] not in self.accounts:
            return {'code': 1, 'msg': 'No this user.'}
        if data['pwd'] != self.accounts[data['uid']]:
            return {'code': 1, 'msg': 'Wrong password.'}
        if self.players[data['uid']] is None:
            self.players[data['uid']] = self.player_cls(data['uid'])
        else:
            self.players[data['uid']].beat = time.time()
        print(f'{data["uid"]} logged in')
        return {
            'code': 0,
            'rid': self.players[data['uid']].rid,
        }

    def ready(self, data):
        if 'uid' not in data or self.players[data['uid']] is None:
            return {'code': 1, 'msg': 'not logged in'}
        if data['rid'] <= 0:
            return {'code': 1, 'msg': 'require room id > 0'}
        if self.players[data['uid']].rid != data['rid'] and self.players[data['uid']].rid > 0 and self.rooms[
            self.players[data['uid']].rid] is not None:
            self.rooms[self.players[data['uid']].rid].remove_player(data['uid'])
        if self.rooms[data['rid']] is None:
            self.rooms[data['rid']] = self.room_cls(rid=data['rid'], root=self)
        res = self.rooms[data['rid']].add_player(data)
        if res['code'] != 0:
            return res
        return self.rooms[data['rid']].player_ready(data)

    def room_action(self, data):
        if 'uid' not in data:
            return {'code': 1}
        if self.rooms[data['rid']] is None or data['uid'] not in self.rooms[data['rid']].inroom:
            return {'code': 1, 'msg': 'wrong room'}
        return getattr(self.rooms[data['rid']], self.cmd_dict[data['cmd']])(data)
