const server_addr = window.location.hostname || '172.18.101.147'
const server_port = '6969'
var server_url = 'http://' + server_addr + ':' + server_port
var ter = 100
var cd = {
        'speak' : 0,
        'chat' : 0,
        'info' : 0,
    }
var beat_fail = 0
var player_id = 0, player_type = 0, play_id = 0, playing = 0
var chat_id = 0

var cards = [], green = [], black = [], grid = [], round = 0
var rival = '', hinter = -1, moji = ''

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


$(() => { 
    $('#nick').val('Alice')
    $('#addr').val(server_addr)
    $('#port').val(server_port)
    // $('#type').val(0)
    let cuid = get_cookie('username')
    let cpwd = get_cookie('password')
    if (cuid) $('#uid').val(cuid)
    if (cpwd) $('#pwd').val(cpwd)

    for(let i=0; i<5; ++i){
        let s = ''
        for(let j=0; j<5; ++j) {
            p0 = '<p id="c_' + (i*5+j) + '"></p>'
            p1 = '<p class="cinfo" id="i_' + (i*5+j) + '"></p>'
            s += '<td class="card" id="b_' + (i*5+j) + '">' + p0 + p1 + '</td>'
        }
        $('#cards').append('<tr>' + s + '</tr>')
    }

    for(let i=0; i<5; ++i)
        for(let j=0; j<5; ++j){
            $('#c_' + (i*5+j)).text((i*5+j))
            $('#b_' + (i*5+j)).click(()=>{guess(i, j)})
        }

    $('#link').click(()=>{
        server_url = 'http://' + $('#addr').val() + ':' + $('#port').val()
        send({
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
        send({
            'cmd' : 'say',
            'cont' : $('#speech').val(),
        }, res=>{})
        $('#speech').val('')
    })

    $('#speak_shit').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        send({
            'cmd' : 'say_shit',
        }, res=>{})
    })

    $('#speak_good').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        send({
            'cmd' : 'say_good',
        }, res=>{})
    })

    $('#speak_fuck').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        send({
            'cmd' : 'say_fuck',
        }, res=>{})
    })

    $('#ready').click(()=>{
        send({
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

    $('#hint').click(()=>{
        if (playing==0) return
        if (player_type!=hinter){
            $('#info2').text('没轮到你给！')
            return
        }
        if ($('#hint0').val().length<1 || $('#hint0').val().length>8){
            $('#info2').text('长度需在1-8之间！')
            return
        }
        keyword = $('#hint0').val()
        for (let ji of keyword){
            if (moji.indexOf(ji)!=-1){
                $('#info2').text('包含词中字：' + ji)
                return
            }
        }

        send({
            'cmd' : 'hint',
            'word': $('#hint0').val(),
            'num' : +$('#hint1').val(),
        }, res=>{
            $('#hint0').val('')
            $('#hint1').val('')
            console.log(res)
        })
    })

    $('#nomore').click(()=>{
        if (playing==0) return
        if (player_type==hinter){
            $('#info1').text('没轮到你猜！')
            return
        }
        send({
            'cmd' : 'nomore',
            'uid' : player_id,
        }, res=>{
        })
    })

    // hot keys
    $(window).on('keypress', function(e) {
        if (e.keyCode ===13) $('#speak').trigger('click')
    })

    setInterval(god, ter)
})


//*************************************************************
ask_chat = ()=>{
    if (cd['chat'] < 500) return
    cd['chat'] = 0
    send({'cmd' : 'ask_chat', 'from' : chat_id}, res=>{
        if(res.n>0){
            for (i in res.data) {
                let cont = ''
                if (res.data[i][0]){
                    cont = res.data[i][0] + ': ' + res.data[i][1]
                    cont = '<div class="chat_box">' + cont + '</div>'
                } else{
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

ask_info = () =>{
    if (player_id == 0 || cd['info'] < 500) return
    cd['info'] = 0
    send({'cmd' : 'info'}, res=>{
        // new game
        if (playing==0 && res.playing==1){
            playing = res.playing
            cards   = res.cards
            green   = res.green
            black   = res.black
            player_type = res.type
            grid    = res.grid.slice()
            for (let i in grid) {
                grid[i] = 0
            }
            round   = res.round
            rival   = res.rival
            hinter  = res.hinter
            $('#hinted').text('')
            $('#chat_board').html('')

            for (let i=0; i<5; ++i) {
                for(let j=0; j<5; ++j){
                    let s = (i*5+j)
                    $('#c_' + s).html(cards[i*5+j])
                    $('#b_' + s).removeClass()
                    $('#b_' + s).addClass('card')
                    $('#i_' + s).html('')
                }
            }

            for (let dot of green) {
                let s = '#b_' + (dot[0]*5+dot[1])
                $(s).addClass('card-yes')
            }

            for (let dot of black) {
                let s = '#b_' + (dot[0]*5+dot[1])
                $(s).addClass('card-no')
            }

            moji = ''
            for (let word of cards){
                moji += word
            }

            return
        }
        if (res.playing == 1 || res.playing==0){
            playing = res.playing
        } else {
            playing = 0
        }
        // playing
        if (playing){
            round   = res.round
            hinter  = res.hinter
            coin    = res.coin
            $('#hinted').html(res.hints)
            $('#credit').text(coin)
            $('#info0').text('回合：'+ (round+1) + '/9')
            $('#info1').text((player_type!=hinter)?'轮到你猜':'轮到你提示')
            for (let i in res.grid) if (grid[i]!=res.grid[i]){
                grid[i] = res.grid[i]
                if (grid[i]==2 || grid[i]==4) {
                    let tar = ((player_type+1)==(grid[i]>>1)) ? $('#nick').val() : rival
                    $('#i_' + i).html($('#i_' + i).html() + tar + '猜错了<br>')
                } else if (grid[i]==1 || grid[i]==3) {
                    let tar = (player_type==(grid[i]>>1)) ? $('#nick').val() : rival
                    $('#i_' + i).html($('#i_' + i).html() + tar + '猜对了<br>')
                    $('#b_' + i).removeClass('card-yes card-no')
                    $('#b_' + i).addClass('card-done')
                }
            }
        }
    })
}

guess = (x, y)=>{
    if (playing==0) return
    if (player_type==hinter){
        $('#info1').text('没轮到你猜！')
        return
    }
    console.log('Guess', x, y)
    send({'cmd' : 'guess', 'uid' : player_id, 'pos' : [x, y]}, res=>{
        if (res.res==1){
            $('#info0').html('结束，按准备继续')
            alert('GG！')
        } else if(res.res==2){
            $('#info2').html('猜过了！')
        } else if(res.res==2){
            $('#info0').html('胜利，按准备继续')
            alert('胜利！')
        }
    })
}

god = ()=>{
    for(i in cd){
        cd[i] = Math.min(cd[i] +ter, 5000)
    }
    // work
    ask_chat()
    ask_info()
}