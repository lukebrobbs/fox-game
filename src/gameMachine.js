import { createMachine, interpret, assign } from "xstate";
import { ICONS } from "./constants";

const toggleHighlighted = (icon, show) =>
  document
    .querySelector(`${ICONS[icon]}-icon`)
    .classList.toggle("highlighted", show);

const incrementClock = assign({
  clock: (context) => context.clock + 1,
});

const gameMachine = createMachine(
  {
    type: "parallel",
    context: {
      clock: 1,
    },
    states: {
      FOX: {
        initial: "INIT",
        states: {
          INIT: {
            on: {
              TICK: {
                actions: "incrementClock",
              },
            },
          },
          HATCHING: {},
          IDLING: {},
          SLEEPING: {},
          EATING: {},
          POOPING: {},
          HUNGRY: {},
          CELEBRATING: {},
          DEAD: {},
        },
      },
      ICONS: {
        initial: "FISH",
        states: {
          FISH: {
            on: {
              RIGHT: "POOP",
              LEFT: "WEATHER",
              SELECT: {
                actions: "selectFish",
              },
            },
            entry: "highlightFish",
            exit: "dehighlightFish",
          },
          POOP: {
            on: {
              RIGHT: "WEATHER",
              LEFT: "FISH",
              SELECT: {
                actions: "selectPoop",
              },
            },
            entry: "highlightPoop",
            exit: "dehighlightPoop",
          },
          WEATHER: {
            on: {
              RIGHT: "FISH",
              LEFT: "POOP",
              SELECT: {
                actions: "selectWeather",
              },
            },
            entry: "highlightWeather",
            exit: "dehighlightWeather",
          },
        },
      },
    },
  },
  {
    actions: {
      incrementClock,
      highlightFish: () => toggleHighlighted("FISH", true),
      dehighlightFish: () => toggleHighlighted("FISH", false),
      selectFish: () => console.log("fish"),
      highlightPoop: () => toggleHighlighted("POOP", true),
      dehighlightPoop: () => toggleHighlighted("POOP", false),
      selectPoop: () => console.log("poop"),
      highlightWeather: () => toggleHighlighted("WEATHER", true),
      dehighlightWeather: () => toggleHighlighted("WEATHER", false),
      selectWeather: () => console.log("weather"),
    },
  }
);

const gameService = interpret(gameMachine)
  .onTransition((state) => console.log(state))
  .start();

export default gameService;
