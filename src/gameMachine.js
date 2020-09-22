import { createMachine, interpret, assign, send, sendParent } from "xstate";
import { NIGHT_LENGTH, DAY_LENGTH } from "./constants";
import { modFox, modScene, toggleHighlighted } from "./ui";

const startClock = assign({
  wakeTime: (context) => context.clock + 3,
});

const incrementClock = assign((context) => {
  console.log(context);
  return {
    clock: context.clock + 1,
  };
});

const iconMachine = createMachine(
  {
    initial: "FEED",
    states: {
      FEED: {
        on: {
          RIGHT: "POOP",
          LEFT: "WEATHER",
          SELECT: {
            actions: sendParent("FEED"),
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
            actions: "cleanupPoop",
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
            actions: sendParent("WEATHER"),
          },
        },
        entry: "highlightWeather",
        exit: "dehighlightWeather",
      },
    },
  },
  {
    actions: {
      highlightFeed: () => toggleHighlighted("FEED", true),
      dehighlightFeed: () => toggleHighlighted("FEED", false),
      highlightPoop: () => toggleHighlighted("POOP", true),
      dehighlightPoop: () => toggleHighlighted("POOP", false),
      cleanupPoop: () => console.log("cleanup poop"),
      highlightWeather: () => toggleHighlighted("WEATHER", true),
      dehighlightWeather: () => toggleHighlighted("WEATHER", false),
    },
  }
);

const sceneMachine = createMachine(
  {
    id: "SCENE",
    context: {
      wakeTime: -1,
      sleepTime: -1,
      clock: 1,
    },
    on: {
      TICK: {
        actions: "incrementClock",
      },
    },
    entry: "startClock",
    initial: "DAY",
    states: {
      DAY: {
        entry: "wake",
        on: {
          TICK: {
            target: "NIGHT",
            actions: sendParent("SLEEP"),
            cond: "isNight",
          },
          WEATHER: "RAIN",
        },
      },
      NIGHT: {
        entry: "sleep",
        on: {
          TICK: {
            target: "DAY",
            actions: sendParent("WAKE"),
            cond: "isDay",
          },
        },
      },
      RAIN: {
        entry: "rain",
        on: {
          WEATHER: {
            target: "DAY",
            actions: "day",
          },
        },
      },
    },
  },
  {
    actions: {
      incrementClock,
      startClock,
      wake: assign((context) => {
        modScene("day");
        return {
          wakeTime: -1,
          sleepTime: context.clock + DAY_LENGTH,
        };
      }),
      sleep: assign((context) => {
        modScene("night");
        return {
          sleepTime: -1,
          wakeTime: context.clock + NIGHT_LENGTH,
        };
      }),
      rain: () => {
        modScene("rain");
        modFox("RAIN");
      },
      day: () => {
        modScene("day");
        modFox("IDLE");
      },
    },
    guards: {
      isDay: (context) => context.wakeTime === context.clock,
      isNight: (context) => context.clock === context.sleepTime,
    },
  }
);

const gameMachine = createMachine(
  {
    initial: "INIT",
    states: {
      INIT: {
        on: {
          SELECT: "PLAYING",
        },
      },
      PLAYING: {
        type: "parallel",
        invoke: [
          {
            id: "ICONS",
            src: iconMachine,
          },
          {
            id: "SCENE",
            src: sceneMachine,
          },
        ],
        on: {
          LEFT: {
            actions: send("LEFT", { to: "ICONS" }),
          },
          RIGHT: {
            actions: send("RIGHT", { to: "ICONS" }),
          },
          WEATHER: {
            actions: send("WEATHER", { to: "SCENE" }),
          },
        },
        states: {
          FOX: {
            initial: "HATCHING",

            states: {
              HATCHING: {
                entry: "hatchAnimation",
                after: {
                  HATCH: "IDLING",
                },
              },
              IDLING: {
                entry: "idleAnimation",
                on: {
                  FEED: "EATING",
                  SLEEP: "SLEEPING",
                  TICK: {
                    actions: send("TICK", { to: "SCENE" }),
                  },
                  SELECT: {
                    actions: send("SELECT", { to: "ICONS" }),
                  },
                },
              },
              SLEEPING: {
                entry: "sleepingAnimation",
                on: {
                  WAKE: "HUNGRY",
                  TICK: {
                    actions: send("TICK", { to: "SCENE" }),
                  },
                },
              },
              EATING: {
                entry: "eatingAnimation",
                after: {
                  EATING: "CELEBRATING",
                },
              },
              POOPING: {},
              HUNGRY: {
                entry: "hungryAnimation",
                on: {
                  FEED: "EATING",
                  SLEEP: "SLEEPING",
                  TICK: {
                    actions: send("TICK", { to: "SCENE" }),
                  },
                  SELECT: {
                    actions: send("SELECT", { to: "ICONS" }),
                  },
                },
              },
              CELEBRATING: {
                entry: "celebratingAnimation",
                after: {
                  CELEBRATE: "IDLING",
                },
              },
              DEAD: {},
            },
          },
        },
      },
    },
  },
  {
    actions: {
      hatchAnimation: () => modFox("HATCH"),
      idleAnimation: () => modFox("IDLE"),
      eatingAnimation: () => modFox("EATING"),
      celebratingAnimation: () => modFox("CELEBRATING"),
      sleepingAnimation: () => modFox("SLEEPING"),
      hungryAnimation: () => modFox("HUNGRY"),
    },
    delays: {
      HATCH: 3500,
      EATING: 3000,
      CELEBRATE: 2500,
    },
  }
);

const gameService = interpret(gameMachine).start();

export default gameService;
