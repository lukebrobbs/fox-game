import gameService from "./machines/gameMachine";
import initButtons from "./buttons";

const TICK_RATE = 3000;

async function init(service) {
  let nextTimeToTick = Date.now();

  function nextAnimationFrame() {
    const now = Date.now();

    if (nextTimeToTick <= now) {
      service.send("TICK");
      nextTimeToTick = now + TICK_RATE;
    }
    requestAnimationFrame(nextAnimationFrame);
  }
  initButtons(service);
  requestAnimationFrame(nextAnimationFrame);
}

init(gameService);
