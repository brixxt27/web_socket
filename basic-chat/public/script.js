import MessageObj from "./MessageObj.js"

let socket = io()
let nickname = prompt("닉네임을 입력하세요.")

let messages = document.getElementById("messages")
let form = document.getElementById("form")
let input = document.getElementById("input")
let typingMessageDiv = document.getElementById("typing-message")

let isTyping = false

function viewMessage(obj) {
  let item = document.createElement("li")
  const { nickname, message } = obj
  item.textContent = `${nickname}: ${message}`
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
}

form.addEventListener("submit", function (e) {
  e.preventDefault()
  if (input.value) {
    const messageObj = new MessageObj(nickname, input.value)
    socket.emit("message", messageObj) // chat message 이벤트 발생
    viewMessage(messageObj)
    input.value = "" // input 값 초기화

    socket.emit("stopTyping")
    isTyping = false
  }
})

input.addEventListener("input", function (e) {
  if (input.value && !isTyping) {
    socket.emit("typing", nickname)
    isTyping = true
  }
  if (!input.value && isTyping) {
    // 작성했다가 전부 지웠을 때
    socket.emit("stopTyping")
    isTyping = false
  }
})

socket.on("typing", function (message) {
  typingMessageDiv.textContent = message
  typingMessageDiv.style.display = "block"
})

socket.on("stopTyping", function () {
  typingMessageDiv.textContent = ""
  typingMessageDiv.style.display = "none"
})

socket.on("message", function (messageObj) {
  viewMessage(messageObj)
})

socket.on("enter", function (messageObj) {
  viewMessage(messageObj)
})

socket.on("exit", function (messageObj) {
  viewMessage(messageObj)
})
