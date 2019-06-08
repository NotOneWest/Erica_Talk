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

// body-parser 기본 모듈 불러오기 및 설정 (POSt req 해석)
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// http Server 시작
app.listen(3000, function() {
    console.log('Example app listenting on port 3000!');
});

// 라우팅 처리
app.get('/', function (req, res) { // req = request, res = respond
    res.render('index.html');
});

app.get('/register', function (req, res) { // req = request, res = respond
    res.render('register.html');
});
  
app.get('/chat', function (req, res) { // req = request, res = respond
    res.render('chat.html');
});