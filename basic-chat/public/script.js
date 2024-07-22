import MessageObj from "./MessageObj.js"

let socket = io()
let nickname = prompt("Enter your nickname")

let messages = document.getElementById("messages")
let form = document.getElementById("form")
let input = document.getElementById("input")

function viewMessage(obj) {
  let item = document.createElement("li")
  const { nickname, message } = obj
  item.textContent = `${nickname}: ${message}`
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
}

form.addEventListener("submit", function (e) {
  // submit event listener
  e.preventDefault()
  if (input.value) {
    // 값이 존재한다면
    const messageObj = new MessageObj(nickname, input.value)
    socket.emit("typing", nickname)
    socket.emit("chat message", messageObj) // chat message 이벤트 발생
    viewMessage(messageObj)
    input.value = "" // input 값 초기화
  }
})

socket.on("chat message", function (messageObj) {
  viewMessage(messageObj)
})

socket.on("enter", function (messageObj) {
  viewMessage(messageObj)
})

socket.on("exit", function (messageObj) {
  viewMessage(messageObj)
})
