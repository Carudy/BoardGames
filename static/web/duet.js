var game_name = 'duet'
const server_addr = window.location.hostname
const server_port = '6969'
var server_url = 'https://' + server_addr + ':' + server_port
var ter = 100
var player_id = 0, player_type = 0, playing = 0
var chat_id = 0

var cards = [], green = [], black = [], grid = [], round = 0
var rival = '', hinter = -1, moji = ''

$(() => {
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

    base_set()

    $('#speak_shit').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        duet_send({
            'cmd' : 'say_shit',
        }, res=>{})
    })

    $('#speak_good').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        duet_send({
            'cmd' : 'say_good',
        }, res=>{})
    })

    $('#speak_fuck').click(()=>{
        if (cd['speak'] < 1000) {
            $('#info2').text('太频繁！')
            return
        }
        cd['speak'] = 0
        duet_send({
            'cmd' : 'say_fuck',
        }, res=>{})
    })

    $('#speak_reset').click(()=>{
        $('#chat_board').text('')
        chat_id = 0
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

        duet_send({
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
        duet_send({
            'cmd' : 'nomore',
            'uid' : player_id,
        }, res=>{
        })
    })

    setInterval(god, ter)
})


//*************************************************************
ask_chat = ()=>{
    if (cd['chat'] < 500) return
    if (player_id == 0) return
    cd['chat'] = 0
    duet_send({'cmd' : 'ask_chat', 'from' : chat_id}, res=>{
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

ask_info = () =>{
    if (player_id == 0 || cd['info'] < 500) return
    cd['info'] = 0
    duet_send({'cmd' : 'info'}, res=>{
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

        if (playing == 1 && res.playing==2){
            alert('胜利!')
            console.log('胜利-playing-2')
            playing = 2
            $('#info0').html('胜利，按准备继续')
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
    duet_send({'cmd' : 'guess', 'uid' : player_id, 'pos' : [x, y]}, res=>{
        if (res.res==1){
            $('#info0').html('结束，按准备继续')
            alert('GG！')
        } else if(res.res==2){
            $('#info2').html('猜过了！')
        } else if(res.res==2){
            $('#info0').html('胜利，按准备继续')
            console.log('胜利-playing-1')
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