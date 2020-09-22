export const ICONS = {
  FEED: ".feed",
  POOP: ".poop",
  WEATHER: ".weather",
};

export const ANIMATIONS = {
  HATCH: "egg",
  IDLE: "idling",
  EATING: "eating",
  CELEBRATING: "celebrate",
  SLEEPING: "sleep",
  RAIN: "rain",
  HUNGRY: "hungry",
};

export const DAY_LENGTH = 30;
export const NIGHT_LENGTH = 20;

export const getNextHungerTime = (clock) =>
  Math.floor(Math.random() * 3) + 5 + clock;

export const getNextDieTime = (clock) =>
  Math.floor(Math.random() * 2) + 3 + clock;
