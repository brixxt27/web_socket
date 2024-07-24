const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const server = http.createServer(app)
const serverSocket = new Server(server, {
  connectionStateRecovery: {
    timeout: 5000,
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
})
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

const chatRoom = '1'

async function main() {
  // open the database file
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database,
  })

  // create our 'messages' table (you can ignore the 'client_offset' column for now)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `)
  /**
   * public 디렉토리에 있는 정적 파일을 제공합니다.
   * js 파일을 HTML 파일에서 불러올 수 있도록 합니다.
   */
  app.use(express.static(path.join(__dirname, 'public')))

  class MessageObj {
    id
    nickname
    message

    constructor(nickname, message) {
      this.nickname = nickname
      this.message = message
    }
  }

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

  /**
   * 채팅방에 입장하면 해당 소켓의 모든 유저에게 입장 메시지를 보냅니다.
   */
  serverSocket.on('connection', async (clientSocket) => {
    clientSocket.join(chatRoom)
    serverSocket
      .in(chatRoom)
      .emit('enter', new MessageObj('system', '채팅방에 입장하셨습니다.'))

    /**
     * 채팅 메시지를 받으면  해당 소켓의 모든 유저에게 메시지를 보냅니다.
     */
    clientSocket.on('message', async (obj) => {
      const { nickname, message } = obj
      console.log(`${nickname}: ` + message)

      let result
      try {
        result = await db.run(
          'INSERT INTO messages (content) VALUES (?)',
          message,
        )
      } catch (e) {
        // TODO handle the failure
        return
      }
      // include the offset with the message
      clientSocket.in(chatRoom).emit('message', obj, result.lastID)
    })

    console.log(clientSocket.handshake.auth.serverOffset)
    if (!clientSocket.recovered) {
      // if the connection state recovery was not successful
      try {
        await db.each(
          'SELECT id, content FROM messages WHERE id > ?',
          [clientSocket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            clientSocket.emit(
              'message',
              new MessageObj('test', row.content),
              row.id,
            )
          },
        )
      } catch (e) {
        // something went wrong
      }
    }

    /**
     * 유저가 타이핑 중이라면 자신을 제외한 소켓에 연결된 모든 유저에게 타이핑 중이라는 메시지를 보냅니다.
     */
    clientSocket.on('typing', (nickname) => {
      clientSocket.in(chatRoom).emit('typing', nickname + '님이 입력 중입니다.')
      // clientSocket.broadcast.emit('typing', nickname + '님이 입력 중입니다.')
    })

    clientSocket.on('stopTyping', () => {
      clientSocket.in(chatRoom).emit('stopTyping')
      // clientSocket.broadcast.emit('stopTyping')
    })

    clientSocket.on('reconnect', () => {
      console.log('reconnect')
    })

    /**
     * 채팅방에서 나가면 자신을 제외한 소켓에 연결된 모든 유저에게 나갔다는 메시지를 보냅니다.
     */
    clientSocket.on('disconnect', () => {
      clientSocket.leave(chatRoom)
      clientSocket
        .in(chatRoom)
        .emit('exit', new MessageObj('system', '채팅방에서 나가셨습니다.'))
      // clientSocket.broadcast.emit(
      //   'exit',
      //   new MessageObj('system', '채팅방에서 나가셨습니다.'),
      // )
    })
  })

  /**
   * 3000 포트로 litening하도록 서버를 실행합니다.
   */
  server.listen(3000, () => {
    console.log('Listening on *:3000')
  })
}

main()
