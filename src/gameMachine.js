import { createMachine, interpret, assign, send, actions } from "xstate";
import {
  NIGHT_LENGTH,
  DAY_LENGTH,
  getNextHungerTime,
  getNextDieTime,
} from "./constants";
import { modFox, modScene, toggleHighlighted } from "./ui";

const { respond } = actions;
const startClock = assign({
  hungryTime: (context) => getNextHungerTime(context.clock),
  deathTime: (context) => getNextDieTime(context.clock),
  wakeTime: (context) => context.clock + 3,
});

const incrementClock = assign((context) => {
  console.log(context);
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
          RAIN: "RAIN_BATHING",
          TICK: {
            actions: respond("CAN_TICK"),
          },
          SELECT: {
            actions: respond("CAN_SELECT"),
          },
        },
      },
      RAIN_BATHING: {
        entry: "rainAnimation",
        on: {
          DAY: "IDLING",
          FEED: "EATING",
          SLEEP: "SLEEPING",
          HUNGRY: "HUNGRY",
          DEATH: "DEAD",
          TICK: {
            actions: respond("CAN_TICK"),
          },
          SELECT: {
            actions: respond("CAN_SELECT"),
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
          SELECT: {
            actions: respond("CAN_SELECT"),
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
          DEATH: "DEAD",
          TICK: {
            actions: respond("CAN_TICK"),
          },
          SELECT: {
            actions: respond("CAN_SELECT"),
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
        entry: "deathAnimation",
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
      deathAnimation: () => {
        modFox("DEAD");
      },
      rainAnimation: () => modFox("RAIN"),
    },
    delays: {
      HATCH: 3500,
      EATING: 3000,
      CELEBRATE: 2500,
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
      cleanupPoop: () => console.log("cleanup poop"),
      highlightWeather: () => toggleHighlighted("WEATHER", true),
      dehighlightWeather: () => toggleHighlighted("WEATHER", false),
    },
  }
);

const sceneMachine = createMachine(
  {
    id: "SCENE",
    initial: "DAY",
    states: {
      DAY: {
        entry: "wake",
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
        entry: "sleep",
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
      startClock,
      wake: () => modScene("day"),
      sleep: () => modScene("night"),
      death: () => modScene("dead"),
      rain: () => modScene("rain"),
      day: () => modScene("day"),
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
    context: {
      wakeTime: -1,
      sleepTime: -1,
      hungryTime: -1,
      deathTime: -1,
      clock: 1,
    },
    states: {
      INIT: {
        on: {
          SELECT: "PLAYING",
        },
      },
      PLAYING: {
        entry: ["startClock", "wake"],
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
        ],
        on: {
          LEFT: {
            actions: send("LEFT", { to: "ICONS" }),
          },
          RIGHT: {
            actions: send("RIGHT", { to: "ICONS" }),
          },
          CAN_SELECT: {
            actions: send("SELECT", { to: "ICONS" }),
          },
          WEATHER: {
            actions: [send("WEATHER", { to: "SCENE" })],
          },
          CAN_TICK: [
            {
              actions: [
                "incrementClock",
                send("DEATH", { to: "FOX" }),
                send("DEATH", { to: "SCENE" }),
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
              actions: ["incrementClock", send("HUNGRY", { to: "FOX" })],
              cond: "isHungry",
            },
            {
              actions: "incrementClock",
            },
          ],
          SELECT: {
            actions: send("SELECT", { to: "FOX" }),
          },
          FEED: {
            actions: [
              send("FEED", { to: "FOX" }),
              "setNextHungryTime",
              "setDeathTime",
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
      startClock,
      wake: assign((context) => {
        return {
          sleepTime: -1,
          wakeTime: context.clock + NIGHT_LENGTH,
        };
      }),
      sleep: assign((context) => {
        return {
          wakeTime: -1,
          sleepTime: context.clock + DAY_LENGTH,
        };
      }),
      setNextHungryTime: assign({
        hungryTime: (context) => getNextHungerTime(context.clock),
      }),
      setDeathTime: assign({
        deathTime: (context) => getNextDieTime(context.clock),
      }),
    },
    guards: {
      isDay: (context) => context.sleepTime === context.clock,
      isNight: (context) => context.clock === context.wakeTime,
      isHungry: (context) => context.clock === context.hungryTime,
      isDead: (context) => context.clock === context.deathTime,
    },
  }
);

const gameService = interpret(gameMachine)
  .onTransition((state) => console.log(state))
  .start();

export default gameService;
