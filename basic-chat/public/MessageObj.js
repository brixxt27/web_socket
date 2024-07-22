export default class MessageObj {
  id;
  nickname;
  message;

  constructor(nickname, message) {
    this.nickname = nickname;
    this.message = message;
  }
}
