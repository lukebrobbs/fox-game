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
  DEAD: "dead",
  POOPING: "pooping",
};

export const DAY_LENGTH = 40;
export const NIGHT_LENGTH = 20;

export const getNextHungerTime = (clock) =>
  Math.floor(Math.random() * 3) + 8 + clock;
export const getNextDieTime = (clock) =>
  Math.floor(Math.random() * 3) + 3 + clock;
export const getNextPoopTime = (clock) =>
  Math.floor(Math.random() * 2) + 8 + clock;
