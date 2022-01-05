import os
from collections import defaultdict
import time
from pathlib import Path
import logging

LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.DEBUG, format=LOG_FORMAT)


class Lobby:
    def __init__(self, name, player_cls, room_cls, cmd_dict):
        self.name = name
        self.player_cls = player_cls
        self.room_cls = room_cls
        self.rooms = defaultdict(lambda: None)
        self.players = defaultdict(lambda: None)
        self.base_path = Path(os.path.dirname(__file__)).parent
        self.accounts = eval(
            (self.base_path / 'static/users').open(encoding='utf-8').read())
        students = eval(
            (self.base_path / 'static/students.txt').open(encoding='utf-8').read())
        for stu in students:
            self.accounts[stu] = stu
        self.cmd_dict = {
            'say': 'add_say',
            'ask_chat': 'ask_say',
            'info': 'ask_info',
        }
        self.cmd_dict.update(cmd_dict)

    def login(self, data):
        if data['uid'] not in self.accounts:
            return {'code': 1, 'msg': 'No this user.'}
        if data['pwd'] != self.accounts[data['uid']]:
            return {'code': 1, 'msg': 'Wrong password.'}
        if self.players[data['uid']] is None:
            self.players[data['uid']] = self.player_cls(data['uid'])
        else:
            self.players[data['uid']].beat = time.time()
        logging.info(f'{data["uid"]} logged in')
        # print(f'{data["uid"]} logged in')
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
            self.rooms[self.players[data['uid']].rid].remove_player(
                data['uid'])
        if self.rooms[data['rid']] is None:
            self.rooms[data['rid']] = self.room_cls(rid=data['rid'], root=self)
        res = self.rooms[data['rid']].add_player(data)
        if res['code'] != 0:
            return res
        return self.rooms[data['rid']].player_ready(data)

    def room_action(self, data):
        if 'uid' not in data:
            return {'code': 1, 'msg': 'not logged in.'}
        if self.rooms[data['rid']] is None or data['uid'] not in self.rooms[data['rid']].inroom:
            return {'code': 1, 'msg': 'wrong room.'}
        try:
            return getattr(self.rooms[data['rid']], self.cmd_dict[data['cmd']])(data)
        except:
            return getattr(self.rooms[data['rid']], data['cmd'])(data)


class RoomBase:
    def __init__(self, rid, root):
        self.root = root
        self.rid = rid
        self.inroom = []
        self.chat = []
        self.playing = 0
        self.round = -1
        self.max_player = 2

    def __getitem__(self, uid):
        return self.root.players[uid]

    def add_player(self, data):
        if len(self.inroom) >= self.max_player and data['uid'] not in self.inroom:
            return {'code': 1, 'msg': 'Room is full'}
        if data['uid'] in self.inroom:
            return {'code': 0, 'msg': 'Already in'}
        self.inroom.append(data['uid'])
        self[data['uid']].rid = self.rid
        logging.info(f'Room {self.rid} now has {self.inroom}')
        # print(f'Room {self.rid} now has {self.inroom}')
        return {'code': 0}

    def remove_player(self, uid):
        if uid in self.inroom:
            self.inroom.remove(uid)
            self.stop_game()

    def player_ready(self, data):
        if 'nick' in data:
            self[data['uid']].name = data['nick']
        if self.playing == 1:
            return {'res': 1, 'msg': 'Already playing.'}
        logging.info('{} get ready.'.format(data['uid']))
        # print('{} get ready.'.format(data['uid']))
        self[data['uid']].ready = 1
        self.start_game()
        return {'res': 0}

    def add_say(self, data):
        if len(self.chat) > 1000:
            self.chat = []
            self.dy_say(u'聊天记录过多，已清理')
        logging.info('Add speak: ', self[data['uid']].name, data['cont'])
        # print('Add speak: ', self[data['uid']].name, data['cont'])
        self.chat.append((self[data['uid']].name, data['cont']))
        return {'res': 0}

    def dy_say(self, cont):
        self.chat.append(('', cont))

    def ask_say(self, data):
        x = data['from']
        if x >= len(self.chat):
            return {'n': 0}
        return {'n': len(self.chat) - x, 'data': self.chat[x:]}

    def start_game(self):
        pass

    def stop_game(self):
        pass
