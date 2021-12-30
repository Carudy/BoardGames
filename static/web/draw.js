var game_name = 'draw'
const server_addr = window.location.hostname
const server_port = '6969'

var server_url = 'http://' + server_addr + ':' + server_port
var lines = [], lines_tmp = [], send_id = 0, send_step = 512
var player_id = 0, player_type = 0, playing = 0, n_reset = 0, chat_id = 0, chance = 3
var game_round = 0
var ctx = $('canvas')[0].getContext('2d')

$(() => {
    $('#addr').val(server_addr)
    $('#port').val(server_port)
    let cuid = get_cookie('username')
    let cpwd = get_cookie('password')
    if (cuid) $('#uid').val(cuid)
    if (cpwd) $('#pwd').val(cpwd)

    base_set()

    var draw_pos = {x:0, y:0}
    var color_dict = {
        '白': '#ccc9cb',
        '红': '#ff1111',
        '绿': '#11ff11',
        '蓝': 'rgb(86,148,199)',
        '黄': '#ffff11',
        '紫': '#ff11ff',
    }
    $('canvas')[0].width = $('#stage').width()
    $('canvas')[0].height = $('#stage').height() * 0.9
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#ccc9cb'

    var set_draw_pos = e => {draw_pos.x = e.offsetX; draw_pos.y = e.offsetY;}

    $('.painter').click((e)=>{
        if (!playing || player_type == 0) return
        ctx.strokeStyle = color_dict[e.target.innerText]
    })

    $('canvas').mousedown(e=>{
        if (!playing || player_type == 0) return
        set_draw_pos(e)
    })

    $('canvas').mouseenter(e=>{
        if (!playing || player_type == 0) return
        set_draw_pos(e)
    })

    $('canvas').mousemove(e=>{
        if (!playing || player_type == 0) return
        if (e.buttons !== 1) return;
        ctx.beginPath()
        let _line = {
            'st': [draw_pos.x, draw_pos.y],
            'color': ctx.strokeStyle,
        }
        ctx.moveTo(draw_pos.x, draw_pos.y)
        set_draw_pos(e);
        ctx.lineTo(draw_pos.x, draw_pos.y)
        _line['ed'] = [draw_pos.x, draw_pos.y]
        lines.push(_line)
        ctx.stroke()
    })

    $('#reset').click(()=>{
        reset_draw()
    })

    $('#hint').click(()=>{
        guess()
    })

    $('#giveup').click(()=>{
        draw_send({'cmd' : 'giveup'}, res=>{})
    })

    $('#upgive').click(()=>{
        draw_send({'cmd' : 'upgive'}, res=>{})
    })

    setInterval(god, ter)
    setInterval(ask_info, 1000)
    setInterval(ask_lines, 1000)
    setInterval(send_lines, 1000)
})

guess = ()=>{
    if (player_type == 1 || chance <= 0) return
    draw_send({'cmd' : 'guess', 'ans': $('#guess_cont').val()}, res=>{
        $('#guess_cont').val('')
    })
}

reset_draw = ()=>{
    if (player_type == 0) return
    lines = []
    send_id = 0
    ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height)
    draw_send({'cmd' : 'reset'}, res=>{})
}

ask_lines = ()=>{
    if (!playing) return
    draw_send({
        'cmd' : 'ask_lines',
        'from': lines.length,
    }, e=>{
        if (!e.hasOwnProperty('lines')) return
        for(let _l of e['lines']){
            ctx.strokeStyle = _l['color']
            ctx.beginPath()
            ctx.moveTo(_l['st'][0], _l['st'][1])
            ctx.lineTo(_l['ed'][0], _l['ed'][1])
            ctx.stroke()
        }
        lines = lines.concat(e['lines'])
    })
}

send_lines = ()=>{
    if (player_type == 0 || +$('#room_id').val()<=0 || send_id >= lines.length){
        return
    }
    to_send = lines.slice(send_id, send_id+send_step)
    send_id = send_id+send_step >= lines.length ? lines.length : send_id+send_step
    draw_send({
        'cmd' : 'new_lines',
        'lines': to_send,
    }, e=>{})
}

ask_info = () =>{
    if (player_id == 0 || +$('#room_id').val()==0) return
    draw_send({'cmd' : 'info'}, res=>{
         if (res.hasOwnProperty('inroom')){
            room_mates = ''
            for (let i of res['inroom']) {
                room_mates += '<li>' + i['name'] + '\t分数：' + i['score'] +'</li>'
            }
            $('#inroom').html(room_mates)
        }
        playing = res['playing']
        player_type = (playing && (player_id == res['painter'])) ? 1 : 0

        if (playing){
            if (game_round != res['round']){
                game_round = res['round']
                lines = []
                send_id = 0
                ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height)
            }
            if (player_type == 0 && res['reset'] != n_reset){
                n_reset = res['reset']
                lines = []
                send_id = 0
                ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height)
            }
            if (player_type == 0) {
                $('#info1').text('提示：' + res['hint'])
                chance = res['chance']
                $('#info2').text('剩余次数：' + chance)
            }else{
                $('#info1').text('你画：' + res['ans'])
            }
        }
    })
}

ask_chat = ()=>{
    if (cd['chat'] < 500) return
    if (player_id == 0) return
    cd['chat'] = 0
    draw_send({'cmd' : 'ask_chat', 'from' : chat_id}, res=>{
        if(res.n>0){
            for (i in res.data) {
                let cont = ''
                if (res.data[i][0] && res.data[i][0] != 'shit'){
                    cont = res.data[i][0] + ': ' + res.data[i][1]
                    cont = '<div class="chat_box">' + cont + '</div>'
                } else if (res.data[i][0] == 'shit') {
                    cont = res.data[i][1]
                    cont = '<div class="chat_box chat_box_shit">' + cont + '</div>'
                } else {
                    cont = res.data[i][1]
                    cont = '<div class="chat_box chat_box_sys">' + cont + '</div>'
                }
                $('#chat_board').html($('#chat_board').html() + cont)
            }
            chat_id += res.n
            $('#chat_board').scrollTop(999999)
        }
    })
}

god = ()=>{
    for(i in cd){
        cd[i] = Math.min(cd[i] + ter, 5000)
    }
    ask_chat()
}
