import gameService from "./gameMachine";
import initButtons from "./buttons";

const TICK_RATE = 3000;

async function init() {
  console.log("Starting game");

  let nextTimeToTick = Date.now();

  function nextAnimationFrame() {
    const now = Date.now();

    if (nextTimeToTick <= now) {
      gameService.send("TICK");
      nextTimeToTick = now + TICK_RATE;
    }
    requestAnimationFrame(nextAnimationFrame);
  }
  initButtons(gameService);
  requestAnimationFrame(nextAnimationFrame);
}

init();
