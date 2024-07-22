const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const server = http.createServer(app);
const io = new Server(server);

/**
 * public 디렉토리에 있는 정적 파일을 제공합니다.
 * js 파일을 HTML 파일에서 불러올 수 있도록 합니다.
 */
app.use(express.static(path.join(__dirname, "public")));

class MessageObj {
  id;
  nickname;
  message;

  constructor(nickname, message) {
    this.nickname = nickname;
    this.message = message;
  }
}

const users = new Map();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * 채팅방에 입장하면 해당 소켓의 모든 유저에게 입장 메시지를 보냅니다.
 */
io.on("connection", (socket) => {
  io.emit("enter", new MessageObj("system", "채팅방에 입장하셨습니다."));

  /**
   * 채팅 메시지를 받으면  해당 소켓의 모든 유저에게 메시지를 보냅니다.
   */
  socket.on("chat message", (obj) => {
    const { nickname, message } = obj;
    console.log(`${nickname}: ` + message);
    socket.broadcast.emit("chat message", obj);
  });

  /**
   * 유저가 타이핑 중이라면 자신을 제외한 소켓에 연결된 모든 유저에게 타이핑 중이라는 메시지를 보냅니다.
   */
  socket.on("typing", (nickname) => {
    socket.broadcast.emit("typing", nickname + "님이 입력 중입니다.");
  });

  /**
   * 채팅방에서 나가면 자신을 제외한 소켓에 연결된 모든 유저에게 나갔다는 메시지를 보냅니다.
   */
  socket.on("disconnect", () => {
    socket.broadcast.emit(
      "exit",
      new MessageObj("system", "채팅방에서 나가셨습니다.")
    );
  });
});

/**
 * 3000 포트로 litening하도록 서버를 실행합니다.
 */
server.listen(3000, () => {
  console.log("Listening on *:3000");
});
