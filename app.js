const express = require('express')
const socket = require('socket.io')
const http = require('http')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = socket(server)

const sqlite3 = require('sqlite3').verbose()

var entertime = new Array()
var time
var pcount = 0

// in memory DB
let db = new sqlite3.Database('./DB/test.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
});

 //:memory:

db.run("CREATE TABLE IF NOT EXISTS chatting_room_name (name TEXT NOT NULL, message TEXT DEFAULT 'A', ts INT)")
// IF NOT EXIST 를 사용하면 DB 가 이미 있는 경우 아무것도 바뀌지 않음. 따라서 다른 형태를 취해야 됨.
//db.run("DROP TABLE IF EXISTS chatting_room_name")
//db.run("CREATE TABLE chatting_room_name (name TEXT NOT NULL DEFAULT 'Anonymous', message TEXT, ts TIMESTAMP DEFAULT CURRENT_TIME)")

app.use('/css', express.static('./static/css'))
app.use('/js', express.static('./static/js'))

/* Get 방식으로 / 경로에 접속하면 실행 됨 */
app.get('/', function(request, response) {
  fs.readFile('./static/index.html', function(err, data) {
    if(err) {
      response.send('에러')
    } else {
      response.writeHead(200, {'Content-Type':'text/html'})
      response.write(data)
      response.end()
    }
  })
})

io.sockets.on('connection', function(socket) {

  /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
  socket.on('newUser', function(name) {
    console.log(name + ' 님이 접속하였습니다.')

    /* 소켓에 이름 저장해두기 */
    socket.name = name

    time = new Date()
    entertime[socket.name]=time.getTime()

    pcount++

    /* 모든 소켓에게 전송 */
    io.sockets.emit('update', {type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.'})
  })

  /* 전송한 메시지 받기 */
  socket.on('message', function(data) {
    /* 받은 데이터에 누가 보냈는지 이름을 추가 */
    data.name = socket.name

    time = new Date()

    db.exec("BEGIN")
    db.run("INSERT INTO chatting_room_name (name, message, ts) VALUES (?,?,?)",[data.name, data.message, time.getTime()])
    // 자바스크립트는 기본으로 () 가 아니라 [] 를 씁니다.
    db.exec("COMMIT")
    console.log('Name : '+data.name+', Message : '+data.message+', Time : '+time.getTime())

    /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', data)
  })

  // 채팅방 인원 확인하고 0이면 db.close()
  socket.on('disconnect', function() {
    console.log(socket.name + '님이 나가셨습니다.')

    if(--pcount == 0)
    {
      db.exec("BEGIN")
      db.run("DROP TABLE IF EXISTS chatting_room_name")
      db.exec("COMMIT")
    }

    /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
    socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'});
  })
})

/* 서버를 3000 포트로 listen */
server.listen(3000, function() {
  console.log('서버 실행 중..')
})

