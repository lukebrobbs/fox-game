export default function initButtons(gameService) {
  const leftBtnEl = document.querySelector(".left-btn");
  const middleBtnEl = document.querySelector(".middle-btn");
  const rightBtnEl = document.querySelector(".right-btn");

  leftBtnEl.addEventListener("click", () => {
    gameService.send("LEFT");
  });
  middleBtnEl.addEventListener("click", () => {
    gameService.send("SELECT");
  });
  rightBtnEl.addEventListener("click", () => {
    gameService.send("RIGHT");
  });
}
