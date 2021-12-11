const server_addr = window.location.hostname || '172.18.101.147'
const server_port = '6969'
var server_url = 'http://' + server_addr + ':' + server_port

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
    $('canvas')[0].width = $('#stage').width()
    $('canvas')[0].height = $('#stage').height()
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#c0392b'

    var set_draw_pos = e => {draw_pos.x = e.offsetX; draw_pos.y = e.offsetY;}
    $('canvas').mousedown(e=>{
        set_draw_pos(e)
    })
    $('canvas').mouseenter(e=>{
        set_draw_pos(e)
    })
    $('canvas').mousemove(e=>{
        if (e.buttons !== 1) return;
        ctx.beginPath()
        ctx.moveTo(draw_pos.x, draw_pos.y)
        set_draw_pos(e);
        ctx.lineTo(draw_pos.x, draw_pos.y)
        ctx.stroke()
    })

})