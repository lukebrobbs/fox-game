import { createMachine, interpret, assign, send, actions } from "xstate";
import { NIGHT_LENGTH, DAY_LENGTH } from "./constants";
import { modFox, modScene, toggleHighlighted } from "./ui";

const { respond } = actions;
const startClock = assign({
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
      DEAD: {},
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
            actions: respond("SLEEP"),
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
            actions: respond("WAKE"),
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

const gameMachine = createMachine({
  initial: "INIT",
  states: {
    INIT: {
      on: {
        SELECT: "PLAYING",
      },
    },
    PLAYING: {
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
          actions: send("WEATHER", { to: "SCENE" }),
        },
        CAN_TICK: {
          actions: send("TICK", { to: "SCENE" }),
        },
        SELECT: {
          actions: send("SELECT", { to: "FOX" }),
        },
        FEED: {
          actions: send("FEED", { to: "FOX" }),
        },
        SLEEP: {
          actions: send("SLEEP", { to: "FOX" }),
        },
        WAKE: {
          actions: send("WAKE", { to: "FOX" }),
        },
        TICK: {
          actions: send("TICK", { to: "FOX" }),
        },
      },
    },
  },
});

const gameService = interpret(gameMachine)
  .onTransition((state) => console.log(state))
  .start();

export default gameService;
