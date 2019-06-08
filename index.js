// Express 기본 모튤 불러오기
var express = require('express');
// Express 객체 생성
var app = express();

// ejs view와 렌더링 설정
app.set('views', __dirname + '/views/ericatalk');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// 정적 파일 제공을 위한 경로 설정
app.use(express.static(__dirname + '/views/ericatalk'));

// DB 설정
const sqlite3 = require('sqlite3').verbose();
 
let db = new sqlite3.Database('./DB/main.db');

db.exec("BEGIN")
db.run('CREATE TABLE IF NOT EXISTS user_info(username TEXT NOT NULL, password TEXT NOT NULL, nickname TEXT NOT NULL)');
db.exec("COMMIT");



// body-parser 기본 모듈 불러오기 및 설정 (POSt req 해석)
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// http Server 시작
app.listen(3000, function() {
    console.log('Example app listenting on port 3000!');
});

// 라우팅 처리
app.get('/', function (req, res) {
    res.render('index.html');
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
            res.render('index.html');
        } else {
            var db_pwd = rows[0].password;
            if(password === db_pwd){
                db.exec("COMMIT");
                res.render('chat.html');
            } else {
                db.exec("COMMIT");
                res.render('index.html');
            }
        }
    });
});

app.get('/register', function (req, res) {
    res.render('register.html');
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
            res.render('register.html');
        }
    });
    db.exec("COMMIT");
    db.exec("BEGIN");
    sql = 'SELECT * FROM user_info WHERE nickname = ?';
    db.all(sql, [nickname], function(err, rows) {
        if(rows.length != 0){
            db.exec("COMMIT");
            res.render('register.html');
        }
    });
    db.exec("COMMIT");
    db.exec("BEGIN");
    sql = 'INSERT INTO user_info VALUES(?, ?, ?)';
    db.run(sql, [username, password, nickname], function(err, rows) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Rows inserted ${this.changes}`);
    });
     db.exec("COMMIT");
    res.redirect('/');
});