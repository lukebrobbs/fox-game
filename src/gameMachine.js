import { createMachine, interpret, assign, sendParent } from "xstate";
import { ICONS } from "./constants";

const toggleHighlighted = (icon, show) =>
  document
    .querySelector(`${ICONS[icon]}-icon`)
    .classList.toggle("highlighted", show);

const startGame = assign({
  wakeTime: (context) => context.clock + 3,
});
const incrementClock = assign({
  clock: (context) => context.clock + 1,
});

const gameMachine = createMachine(
  {
    initial: "INIT",

    context: {
      clock: 1,
      wakeTime: -1,
    },
    states: {
      INIT: {
        on: {
          SELECT: "PLAYING",
        },
      },
      PLAYING: {
        type: "parallel",
        entry: "startGame",

        states: {
          FOX: {
            initial: "HATCHING",
            on: {
              TICK: {
                actions: "incrementClock",
              },
            },
            states: {
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
            initial: "FEED",
            states: {
              FEED: {
                on: {
                  RIGHT: "POOP",
                  LEFT: "WEATHER",

                  SELECT: {
                    actions: sendParent("TYAGUE"),
                  },
                },
                entry: "highlightFeed",
                exit: "dehighlightFeed",
              },
              POOP: {
                on: {
                  RIGHT: "WEATHER",
                  LEFT: "FEED",
                  SELECT: {
                    actions: "selectPoop",
                  },
                },
                entry: "highlightPoop",
                exit: "dehighlightPoop",
              },
              WEATHER: {
                on: {
                  RIGHT: "FEED",
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
    },
  },
  {
    actions: {
      startGame,
      incrementClock,
      highlightFeed: () => toggleHighlighted("FEED", true),
      dehighlightFeed: () => toggleHighlighted("FEED", false),
      selectFeed: () => console.log("feed"),
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
