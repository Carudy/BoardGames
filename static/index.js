const server_addr = window.location.hostname || '192.168.195.162'
const server_port = '6969'
var   server_url = 'http://' + server_addr + ':' + server_port
var   ter = 100
var cd = {
        'beat' : 0,
        'chat' : 0,
        'info' : 0,
    }
var beat_fail = 0
var player_id = 0, player_type = 0, play_id = 0, playing = 0
var chat_id = 0

var cards = [], green = [], black = [], grid = [], round = 0
var rival = '', hinter = -1, moji = ''

$(() => { 
    $('#nick').val('Alice')
    $('#addr').val(server_addr)
    $('#port').val(server_port)
    // $('#type').val(0)

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
        if (player_id) return
        server_url = 'http://' + $('#addr').val() + ':' + $('#port').val()
        send({
                'cmd' : 'reg',
                'name' : $('#nick').val(),
            }, res=>{
                $('#info0').text(res.uid==-1 ? '人满了':(res.uid==-2 ? '昵称重复' : '成功连接'))
                player_id = res.uid
                beat_fail = 0
            })
    })

    $('#speak').click(()=>{
        if($('#speech').val().length==0){
            $('#info2').text('消息不能为空！')
            return
        }

        send({
            'cmd' : 'say',
            'uid' : player_id,
            'cont' : $('#speech').val(),
        }, res=>{})
        $('#speech').val('')
    })


    $('#ready').click(()=>{
        send({
            'cmd' : 'ready',
            'uid' : player_id,
        }, res=>{
            if(res.res==0){
                $('#info1').text('准备就绪')
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
            $('#info2').text('长度不行！')
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
            'uid' : player_id,
            'word': $('#hint0').val(),
            'num' : +$('#hint1').val(),
        }, res=>{
            $('#hint0').val('')
            $('#hint1').val('')
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
    $(window).on('keypress', function(e) {
        if (e.keyCode ===13) $('#speak').trigger('click')
    })

    setInterval(god, ter)
})


//************************************************************* 
send = (data, callback)=>{
    data['game_name'] = 'duet'
    $.post('/', {'data': JSON.stringify(data)}, (res)=>{
        callback(res)
    })
}

heart_beat = ()=>{
    if (player_id==0) return
    if (cd['beat'] >= 1500) {
        beat_fail += 1
        cd['beat'] = 0
        send({'cmd' : 'beat', 'uid' : player_id}, res=>{
            if(res.res=='ok'){
                beat_fail = 0
            }else{
                $('#info0').text('暂时连接失败')
                // player_id = 0
            }
        })
    }
    if(beat_fail>6){
        $('#info0').text('连接失败')
        player_id = 0
    }
}

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
    if (cd['info'] < 500) return
    cd['info'] = 0
    send({'cmd' : 'info', 'uid' : player_id}, res=>{
        // new game
        if (playing==0 && res.playing==1){
            playing = res.playing
            cards   = res.cards
            green   = res.green
            black   = res.black
            player_type = res.type
            grid    = res.grid.slice()
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
        }
        playing = res.playing
        // playing
        if (playing){
            round   = res.round
            hinter  = res.hinter
            coin    = res.coin
            // console.log(res.hints)
            $('#hinted').text(res.hints)
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
    for(i in cd){ cd[i] += ter }

    // whether alive
    heart_beat()
    if(beat_fail>1){return}
    if(player_id==0){return}
    
    // work
    ask_chat()
    ask_info()
}