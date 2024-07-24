import MessageObj from './MessageObj.js'

const socket = io({
  auth: {
    serverOffset: 0,
  },
})

const messages = document.getElementById('messages')
const form = document.getElementById('form')
const input = document.getElementById('input')
const typingMessageDiv = document.getElementById('typing-message')
const toggleButton = document.getElementById('toggle-btn')

let nickname = prompt('닉네임을 입력하세요.')
let isTyping = false

/**
 * 채팅 메시지를 화면에 표시합니다.
 * @param {*} obj
 */
function viewMessage(obj) {
  let item = document.createElement('li')
  const { nickname: senderNickname, message } = obj
  item.textContent = `${senderNickname}: ${message}`
  item.classList.add(senderNickname === nickname ? 'sent' : 'received')
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
}

/**
 * 메시지 전송 이벤트를 처리합니다.
 * 메시지 전송 이벤트와 타이핑 정지 이벤트를 처리합니다.
 */
form.addEventListener('submit', function (e) {
  e.preventDefault()
  if (input.value) {
    const messageObj = new MessageObj(nickname, input.value)
    socket.emit('message', messageObj) // chat message 이벤트 발생
    viewMessage(messageObj)
    input.value = '' // input 값 초기화

    socket.emit('stopTyping')
    isTyping = false
  }
})

/**
 * 입력 이벤트를 처리합니다.
 * 첫 입력일 때 타이핑 이벤트를 발생 시킵니다.
 * 타이핑 중이지만 값이 존재하지 않을 때 타이핑 정지 이벤트를 발생 시킵니다.
 */
input.addEventListener('input', function (e) {
  // if (input.value && !isTyping) {
  if (input.value && !isTyping) {
    socket.emit('typing', nickname)
    isTyping = true
  }
  if (!input.value && isTyping) {
    socket.emit('stopTyping')
    isTyping = false
  }
})

toggleButton.addEventListener('click', (e) => {
  e.preventDefault()
  if (socket.connected) {
    socket.disconnect()
    toggleButton.innerText = 'Connect'
  } else {
    socket.connect()
    toggleButton.innerText = 'Disconnect'
  }
})

socket.on('typing', function (message) {
  typingMessageDiv.textContent = message
  typingMessageDiv.style.display = 'block'
})

socket.on('stopTyping', function () {
  typingMessageDiv.textContent = ''
  typingMessageDiv.style.display = 'none'
})

socket.on('message', function (messageObj, serverOffset) {
  viewMessage(messageObj)
  socket.auth.serverOffset = serverOffset
})

socket.on('enter', function (messageObj) {
  viewMessage(messageObj)
})

socket.on('exit', function (messageObj) {
  viewMessage(messageObj)
})
