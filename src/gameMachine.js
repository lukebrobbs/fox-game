import { createMachine, interpret, assign, send, actions } from "xstate";
import {
  NIGHT_LENGTH,
  DAY_LENGTH,
  getNextHungerTime,
  getNextDieTime,
  getNextPoopTime,
} from "./constants";
import {
  modFox,
  modScene,
  toggleHighlighted,
  togglePoopBag,
  writeModal,
} from "./ui";

const { respond } = actions;

const incrementClock = assign((context) => {
  return {
    clock: context.clock + 1,
  };
});

const foxMachine = createMachine(
  {
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
          HUNGRY: "HUNGRY",
          DEATH: "DEAD",
          RAIN: {
            actions: "rainAnimation",
          },
          DAY: {
            actions: "idleAnimation",
          },
          POOPING: "POOPING",
          TICK: {
            actions: respond("CAN_TICK"),
          },
        },
      },

      SLEEPING: {
        entry: "sleepingAnimation",
        on: {
          WAKE: "HUNGRY",
          TICK: {
            actions: respond("CAN_TICK"),
          },
        },
      },
      EATING: {
        entry: "eatingAnimation",
        after: {
          EATING: "CELEBRATING",
        },
      },
      POOPING: {
        entry: "poopingAnimation",
        after: {
          POOP_TIME: "POOPED",
        },
      },
      POOPED: {
        on: {
          CELEBRATING: "CELEBRATING",
          DEATH: "DEAD",
          TICK: {
            actions: respond("CAN_TICK"),
          },
        },
      },
      HUNGRY: {
        entry: "hungryAnimation",
        on: {
          FEED: "EATING",
          SLEEP: "SLEEPING",
          DEATH: "DEAD",
          POOPING: "POOPING",
          TICK: {
            actions: respond("CAN_TICK"),
          },
        },
      },
      CELEBRATING: {
        entry: "celebratingAnimation",
        after: {
          CELEBRATE: "IDLING",
        },
      },
      DEAD: {
        entry: ["deathAnimation", respond("GAME_OVER")],
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
      deathAnimation: () => modFox("DEAD"),
      rainAnimation: () => modFox("RAIN"),
      poopingAnimation: () => modFox("POOPING"),
    },
    delays: {
      HATCH: 3500,
      EATING: 3000,
      CELEBRATE: 2500,
      POOP_TIME: 2500,
    },
  }
);

const iconMachine = createMachine(
  {
    initial: "FEED",
    states: {
      FEED: {
        on: {
          RIGHT: "POOP",
          LEFT: "WEATHER",
          SELECT: {
            actions: respond("FEED"),
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
            actions: respond("CLEANUP"),
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
            actions: respond("WEATHER"),
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
      highlightWeather: () => toggleHighlighted("WEATHER", true),
      dehighlightWeather: () => toggleHighlighted("WEATHER", false),
    },
  }
);

const poopMachine = createMachine(
  {
    initial: "HIDDEN",
    states: {
      HIDDEN: {
        entry: "hidePoopBag",
        on: {
          POOP: "HAS_POOPED",
        },
      },
      HAS_POOPED: {
        on: {
          CLEANUP: "SHOW",
        },
      },
      SHOW: {
        entry: "showPoopBag",
        after: {
          CLEANUP: "HIDDEN",
        },
      },
    },
  },
  {
    actions: {
      showPoopBag: () => togglePoopBag(true),
      hidePoopBag: () => togglePoopBag(false),
    },
    delays: {
      CLEANUP: 3000,
    },
  }
);

const sceneMachine = createMachine(
  {
    id: "SCENE",
    initial: "DAY",

    states: {
      DAY: {
        entry: "day",
        on: {
          NIGHT: {
            target: "NIGHT",
            actions: respond("SLEEP"),
          },
          WEATHER: {
            target: "RAIN",
            actions: respond("RAIN"),
          },
          DEATH: "DEAD",
        },
      },
      NIGHT: {
        entry: "night",
        on: {
          DAY: {
            target: "DAY",
            actions: respond("WAKE"),
          },
        },
      },
      RAIN: {
        entry: "rain",
        on: {
          WEATHER: {
            target: "DAY",
            actions: ["day", respond("DAY")],
          },
          NIGHT: {
            target: "NIGHT",
            actions: respond("SLEEP"),
          },
          DEATH: "DEAD",
        },
      },
      DEAD: {
        entry: "death",
      },
    },
  },
  {
    actions: {
      night: () => modScene("night"),
      death: () => modScene("dead"),
      rain: () => modScene("rain"),
      day: () => modScene("day"),
    },
  }
);

const gameMachine = createMachine(
  {
    initial: "INIT",
    context: {
      sleepTime: -1,
      wakeTime: -1,
      hungryTime: -1,
      deathTime: -1,
      poopTime: -1,
      clock: 1,
    },
    states: {
      INIT: {
        on: {
          SELECT: "PLAYING",
        },
      },
      PLAYING: {
        entry: ["wake", "clearModal"],
        invoke: [
          {
            id: "ICONS",
            src: iconMachine,
          },
          {
            id: "SCENE",
            src: sceneMachine,
          },
          {
            id: "FOX",
            src: foxMachine,
          },
          {
            id: "POOP",
            src: poopMachine,
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
            actions: [send("WEATHER", { to: "SCENE" })],
          },
          GAME_OVER: "INIT",
          CAN_TICK: [
            {
              actions: [
                "incrementClock",
                send("DEATH", { to: "FOX" }),
                send("DEATH", { to: "SCENE" }),
                "death",
              ],
              cond: "isDead",
            },
            {
              actions: ["incrementClock", send("NIGHT", { to: "SCENE" })],
              cond: "isNight",
            },
            {
              actions: ["incrementClock", send("DAY", { to: "SCENE" })],
              cond: "isDay",
            },
            {
              actions: [
                "incrementClock",
                "setDeathTime",
                send("HUNGRY", { to: "FOX" }),
              ],
              cond: "isHungry",
            },
            {
              actions: [
                "incrementClock",
                send("POOPING", { to: "FOX" }),
                send("POOP", { to: "POOP" }),
                "poop",
              ],
              cond: "isPooping",
            },
            {
              actions: "incrementClock",
            },
          ],
          SELECT: {
            actions: send("SELECT", { to: "ICONS" }),
          },
          FEED: {
            actions: [send("FEED", { to: "FOX" }), "eat"],
          },
          CLEANUP: {
            actions: [
              "cleanup",
              send("CLEANUP", { to: "POOP" }),
              send("CELEBRATING", { to: "FOX" }),
            ],
          },
          SLEEP: {
            actions: ["sleep", send("SLEEP", { to: "FOX" })],
          },
          WAKE: {
            actions: ["wake", send("WAKE", { to: "FOX" })],
          },
          RAIN: {
            actions: send("RAIN", { to: "FOX" }),
          },
          DAY: {
            actions: send("DAY", { to: "FOX" }),
          },
          TICK: {
            actions: send("TICK", { to: "FOX" }),
          },
        },
      },
    },
  },
  {
    actions: {
      incrementClock,
      wake: assign((context) => {
        return {
          wakeTime: -1,
          sleepTime: context.clock + DAY_LENGTH,
          hungryTime: getNextHungerTime(context.clock),
        };
      }),
      sleep: assign((context) => {
        return {
          sleepTime: -1,
          wakeTime: context.clock + NIGHT_LENGTH,
          hungryTime: -1,
          poopTime: -1,
          deathTime: -1,
        };
      }),
      death: assign(() => {
        writeModal("The fox died :( <br/> Press the middle button to start");

        return {
          sleepTime: -1,
          wakeTime: -1,
          hungryTime: -1,
          poopTime: -1,
          deathTime: -1,
        };
      }),
      setDeathTime: assign({
        deathTime: (context) => getNextDieTime(context.clock),
      }),
      eat: assign({
        hungryTime: (context) => getNextHungerTime(context.clock),
        poopTime: (context) => getNextPoopTime(context.clock),
        deathTime: () => -1,
      }),
      poop: assign({
        poopTime: () => -1,
        hungryTime: (context) => getNextHungerTime(context.clock),
        deathTime: (context) => getNextDieTime(context.clock),
      }),
      cleanup: assign({
        deathTime: () => -1,
      }),
      clearModal: () => writeModal(),
    },
    guards: {
      isDay: (context) => context.wakeTime === context.clock,
      isNight: (context) => context.clock === context.sleepTime,
      isHungry: (context) => context.clock === context.hungryTime,
      isPooping: (context) => context.clock === context.poopTime,
      isDead: (context) => context.clock === context.deathTime,
    },
  }
);

const gameService = interpret(gameMachine).start();

export default gameService;
