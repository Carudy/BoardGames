var game_name = 'draw'
const server_addr = window.location.hostname
const server_port = '6969'

var server_url = 'http://' + server_addr + ':' + server_port
var lines = [], lines_tmp = [], send_id = 0, send_step = 10
var player_id = 0, player_type = 0, playing = 0

in_same_line = (A, B)=>{
    if (A.x == B.x || A.y == B.y){
        return true;
    }
    if (A.x == 0 || B.x == 0){
        return false;
    }
    return (A.y / A.x) == (B.y / B.x)
}

compress_lines = L =>{
    ret = []
    now = L[0]
    for (let i of L.slice(1)){
        if (now.ed.toString() == i.st.toString() && now.color == i.color && in_same_line(i, now)){
            now.ed = i.ed
        } else {
            ret.push(now)
            now = i
        }
    }
    ret.push(now)
    return ret
}

send_lines = ()=>{
//    if (player_id == 0 || +$('#room_id').val()==0){
//        return
//    }
    lines = lines.concat(compress_lines(lines_tmp))
    if (send_id >= lines.length){
        return
    }
    to_send = lines.slice(send_id, send_id+send_step)
    send_id = send_id+send_step >= lines.length ? lines.length : send_id+send_step
    draw_send({
        'cmd' : 'new_lines',
        'lines': to_send,
    }, e=>{console.log(e)})
}

$(() => {
    $('#addr').val(server_addr)
    $('#port').val(server_port)
    let cuid = get_cookie('username')
    let cpwd = get_cookie('password')
    if (cuid) $('#uid').val(cuid)
    if (cpwd) $('#pwd').val(cpwd)

    base_set()

    var ctx = $('canvas')[0].getContext('2d')
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
        ctx.strokeStyle = color_dict[e.target.innerText]
    })

    $('canvas').mousedown(e=>{
        set_draw_pos(e)
    })

    $('canvas').mouseenter(e=>{
        set_draw_pos(e)
    })

    $('canvas').mousemove(e=>{
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
        lines_tmp.push(_line)
        ctx.stroke()
    })

    $('#reset').click(()=>{
        lines = []
        send_id = 0
        ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height)
    })

    $('#hint').click(()=>{
        send_lines()
    })

    setInterval(god, ter)
})

ask_info = () =>{
    if (player_id == 0 || +$('#room_id').val()==0 || cd['info'] < 500) return
    cd['info'] = 0
    draw_send({'cmd' : 'info'}, res=>{
         if (res.hasOwnProperty('inroom')){
            room_mates = ''
            for (let i of res['inroom']) {
                room_mates += '<li>' + i['name'] + '\t分数：' + i['score'] +'</li>'
            }
            $('#inroom').html(room_mates)
        }

        playing = res['playing']
        if (playing) player_type = player_id == res['painter'] ? 1 : 0
    })
}
~
god = ()=>{
    for(i in cd){
        cd[i] = Math.min(cd[i] +ter, 5000)
    }
    ask_info()
//    ask_line()
}