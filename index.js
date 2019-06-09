const express = require('express')
const socket = require('socket.io')
const http = require('http')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = socket(server)

const sqlite3 = require('sqlite3').verbose()

var entertime = new Array()// 필요에 따라 지움
var time
var pcount = 0
var nick

// ejs view와 렌더링 설정
app.set('views', __dirname + '/views/ericatalk');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// 정적 파일 제공을 위한 경로 설정
app.use(express.static(__dirname + '/views/ericatalk'));
 
let db = new sqlite3.Database('./DB/main.db');
let db_chat = new sqlite3.Database('./DB/chat.db');

db_chat.exec("BEGIN")
db_chat.run('CREATE TABLE IF NOT EXISTS user_info(username TEXT NOT NULL, password TEXT NOT NULL, nickname TEXT NOT NULL)');
db_chat.exec("COMMIT");

// body-parser 기본 모듈 불러오기 및 설정 (POSt req 해석)
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

db_chat.run("CREATE TABLE IF NOT EXISTS chatting_room_name (name TEXT NOT NULL, message TEXT DEFAULT '', ts INT)")
// http Server 시작
server.listen(3000, function() {
    console.log('Example app listenting on port 3000!');
});

// 라우팅 처리
app.get('/', function (req, res) {
    res.render('index.ejs', {alert_id: false, alert_pwd: false});
});

app.post('/', function (req, res) {
    var username = req.body.name;
    var password = req.body.pwd;

    // DB 처리
    db.exec("BEGIN");
    var sql = 'SELECT * FROM user_info WHERE username = ?';
    db.all(sql, [username], function(err, rows) {
        if(rows.length === 0){
            db.exec("COMMIT");
            res.render('index.ejs', {alert_id: true, alert_pwd: false});
        } else {
            var db_pwd = rows[0].password;
            if(password === db_pwd){
                //io.sockets.emit('connect',{nick : rows[0].nickname}) // 배열 인덱스 적어야 됨.
                nick = rows[0].nickname
                db.exec("COMMIT")
                res.render('chat.html');
            } else {
                db.exec("COMMIT");
                res.render('index.ejs', {alert_id: false, alert_pwd: true});
            }
        }
    });
});

app.get('/register', function (req, res) {
    res.render('register.html', {alert1: false, alert2: false, alert3: false});
});

app.post('/register', function (req, res) {
    var username = req.body.name;
    var password = req.body.pwd;
    var passwordconf = req.body.pwdconf;
    var nickname = req.body.nick;

    // DB 설정
    db.exec("BEGIN");
    var sql = 'SELECT * FROM user_info WHERE username = ?';
    db.all(sql, [username], function(err, rows) {
        if(rows.length != 0){
            db.exec("COMMIT");
            res.render('register.html', {alert1: true, alert2: false, alert3: false});
        } else {
            db.exec("COMMIT");
            db.exec("BEGIN");
            sql = 'SELECT * FROM user_info WHERE nickname = ?';
            db.all(sql, [nickname], function(err, rows) {
                if(rows.length != 0){
                    db.exec("COMMIT");
                    res.render('register.html', {alert1: false, alert2: true, alert3: false});
                } else {
                    sql = 'INSERT INTO user_info VALUES(?, ?, ?)';
                    if(password != passwordconf){
                        db.exec("COMMIT");
                        res.render('register.html', {alert1: false, alert2: false, alert3: true});
                    } else {
                        db.exec("COMMIT");
                        db.exec("BEGIN");
                        db.run(sql, [username, password, nickname], function(err, rows) {
                            if (err) {
                                return console.error(err.message);
                            }
                            console.log(`Rows inserted ${this.changes}`);
                        });
                        db.exec("COMMIT");
                        res.redirect('/');
                    }
                }
            });
        }
    });
});
