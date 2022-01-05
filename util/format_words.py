'''
Author: ZhXZhao
Date: 2022-01-05 11:47:42
LastEditors: ZhXZhao
LastEditTime: 2022-01-05 11:57:40
Description: file content
'''

str = "狐狸、老虎、大象、海豚、恐龙、老鼠、蟑螂、蝴蝶、北极熊、熊猫、长颈鹿、蝎子、鸭子、金鱼、蜈蚣、狮子、孔雀、猩猩、大灰狼、猴子、小鸡、老鹰、白马、螃蟹、青蛙、蜻蜓、鸵鸟、山羊、蜗牛、萤火虫、猫、猫头鹰、刺猬、燕子、虾、马蜂、螳螂、蚂蚁、小白兔、金钱豹"

str = str.replace(' ', '')

ll = str.split('、')

for i in ll:
    print("\"", end="")
    print(i, end="")
    print("\"", end=", ")
