var cd = {
        'speak' : 0,
        'chat' : 0,
        'info' : 0,
    }

var game_name = 'duet'
var ter = 100

send = (game_name, data, callback)=>{
    data['game_name'] = game_name
    data['rid'] = +$('#room_id').val()
    if (data['cmd'] != 'login' && player_id != 0){
        data['uid'] = player_id
    }
    $.post('/', {'data': JSON.stringify(data)}, (res)=>{
        if (res.hasOwnProperty('res') && res['res'] != 0){
            console.log(res)
        }
        callback(res)
    })
}

duet_send = (data, cb) => send('duet', data, cb)
draw_send = (data, cb) => send('draw', data, cb)


set_cookie = (k, v) =>{
    let d = new Date()
    d.setTime(d.getTime()+(24*60*60*1000))
    let expires = "expires="+d.toGMTString()
    document.cookie = k + "=" + v + "; " + expires
}

get_cookie = (k) =>{
    let name = k + "=";
    let ca = document.cookie.split(';');
    for(let i=0; i<ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name)==0)
            return c.substring(name.length,c.length);
    }
    return "";
}

base_set = () => {
    $('#link').click(()=>{
        server_url = 'https://' + $('#addr').val() + ':' + $('#port').val()
        send(game_name, {
                'cmd' : 'login',
                'uid' : $('#uid').val(),
                'pwd' : $('#pwd').val(),
            }, res=>{
                $('#info0').text(res.code==0 ? '登录成功' : res.msg)
                player_id = $('#uid').val()
                $('#nick').val(player_id)
                set_cookie('username', $('#uid').val())
                set_cookie('password', $('#pwd').val())
                if (res.rid > 0){
                    $('#room_id').val(res.rid)
                } else {
                    $('#room_id').val(0)
                }
            })
    })

    $('#speak').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('说话太频繁！')
            return
        }
        cd['speak'] = 0
        if($('#speech').val().length==0){
            $('#info2').text('消息不能为空！')
            return
        }
        send(game_name, {
            'cmd' : 'say',
            'cont' : $('#speech').val(),
        }, res=>{})
        $('#speech').val('')
    })

    $('#ready').click(()=>{
        send(game_name, {
            'cmd' : 'ready',
            'nick': $('#nick').val(),
        }, res=>{
            if(res.res==0){
                $('#info1').text('准备就绪')
            }else{
                $('#info1').text(res['msg'])
            }
        })
    })

    // hot keys
    $(window).on('keypress', function(e) {
        if (e.keyCode ===13) $('#speak').trigger('click')
    })
}