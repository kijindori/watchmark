import express from "express";
import bodyParser from 'body-parser'
import {assert, log} from "console";
import env from "dotenv";
env.config();
import methodOverride from "method-override";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import sharedSession from "express-socket.io-session"
import morgan from "morgan";
import {writer} from "./utils/writeable.js"
import ejs from "ejs";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger/swagger-output.json" assert {type:"json"}; 
import {Server} from 'socket.io';
import path from 'path';

let app = express();
let socketId;
const __dirname = path.resolve();
const mySQLStore = MySQLStore(session);

import indexRouter from "./routes/index.js"
import managerRouter from "./routes/manage/index.js"

//BigInt json.stringify typeerror 해결
BigInt.prototype.toJSON = function () {
    return this.toString();
  };

const options = {
    host: "localhost",  /* IP 입력해주세요. */
    user: process.env.DBID, 
    password: process.env.DBPASS,
    port:"3306",
    database: "db23202",
  };

var sessionStore = new mySQLStore(options);

// express 는 함수이므로, 반환값을 변수에 저장한다.
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

const maxAge = 1000 * 60 * 60 * 100;

const sessionMiddleware = session({
  cookie: {
      path: '/',
      maxAge,
    },
    rolling: true,
  store: sessionStore,
  resave: false,
  secret: process.env.secret,
  saveUninitialized: true,
})

app.use(sessionMiddleware);


//middleware
morgan.token('body', (req, res) => JSON.stringify(req.body));
morgan.token('param', (req, res) => JSON.stringify(req.params));
app.use(morgan(':param|:method|:url|:date[web]|:status|:body|', {stream: writer}));
app.use(methodOverride('_method'));
app.use(express.static('.'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile,{explorer:true})
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/", indexRouter);
app.use("/", managerRouter);

const httpServer = app.listen(process.env.PORT, function() {
    log(`express server on port ${process.env.PORT}`)
});

const io = new Server(httpServer,{path:"/socket.io"});

io.use(sharedSession(sessionMiddleware, {
  autoSave:true
}));

io.on('connection', (socket) => {
  console.log(`새로운 클라이언트 [${socket.id}] 접속`);
  global.socketId = socket.id;
  // 클라이언트로부터 메시지를 받았을 때 처리
  socket.on('message', (data) => {
    console.log(`클라이언트 [${socket.id}]로부터 메시지를 받았습니다: ${data}`);
  });

  // 클라이언트와 연결이 끊어졌을 때 처리
  socket.on('disconnect', () => {
    console.log(`클라이언트 [${socket.id}]와의 연결이 종료되었습니다.`);
  });
});