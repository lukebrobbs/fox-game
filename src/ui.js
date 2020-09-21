import { ANIMATIONS, ICONS } from "./constants";

export const modFox = function (state) {
  document.querySelector(".fox").className = `fox fox-${ANIMATIONS[state]}`;
};
export const modScene = function (state) {
  document.querySelector(".game").className = `game ${state}`;
};
export const togglePoopBag = (hidden) => {
  document.querySelector(".poop-bag").classList.toggle("hidden", hidden);
};

export const toggleHighlighted = (icon, show) =>
  document
    .querySelector(`${ICONS[icon]}-icon`)
    .classList.toggle("highlighted", show);
