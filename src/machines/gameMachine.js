import { createMachine, interpret, assign, send, forwardTo } from "xstate";
import foxMachine from "./foxMachine";
import iconMachine from "./iconMachine";
import poopMachine from "./poopMachine";
import sceneMachine from "./sceneMachine";
import {
  NIGHT_LENGTH,
  DAY_LENGTH,
  getNextHungerTime,
  getNextDieTime,
  getNextPoopTime,
} from "../constants";
import { writeModal } from "../ui";

const incrementClock = assign((context) => {
  return {
    clock: context.clock + 1,
  };
});

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
            actions: forwardTo("ICONS"),
          },
          RIGHT: {
            actions: forwardTo("ICONS"),
          },

          WEATHER: {
            actions: forwardTo("SCENE"),
          },
          GAME_OVER: "INIT",
          TOCK: [
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
                "poop",
                send("POOPING", { to: "FOX" }),
                send("POOP", { to: "POOP" }),
              ],
              cond: "isPooping",
            },
            {
              actions: "incrementClock",
            },
          ],
          SELECT: {
            actions: forwardTo("ICONS"),
          },
          FEED: {
            actions: ["eat", forwardTo("FOX")],
          },
          CLEANUP: {
            actions: [
              "cleanup",
              forwardTo("POOP"),
              send("CELEBRATING", { to: "FOX" }),
            ],
          },
          SLEEP: {
            actions: ["sleep", forwardTo("FOX")],
          },
          WAKE: {
            actions: ["wake", forwardTo("FOX")],
          },
          RAIN: {
            actions: forwardTo("FOX"),
          },
          DAY: {
            actions: forwardTo("FOX"),
          },
          TICK: {
            actions: forwardTo("FOX"),
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
