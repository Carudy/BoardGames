const server_addr = window.location.hostname || '172.18.101.147'
const server_port = '6969'
var server_url = 'http://' + server_addr + ':' + server_port
var lines = [], send_id = 0
var player_id = 0, player_type = 0

send = (data, callback)=>{
    data['game_name'] = 'duet'
    data['rid'] = +$('#room_id').val()
    if (data['cmd'] != 'login' && player_id != 0){
        data['uid'] = player_id
    }
    $.post('/', {'data': JSON.stringify(data)}, (res)=>{
        callback(res)
    })
}

$(() => {
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
        lines.push(_line)
        ctx.stroke()
    })

    $('#reset').click(()=>{
        lines = []
        send_id = 0
        ctx.clearRect(0, 0, $('canvas')[0].width, $('canvas')[0].height)
    })

})