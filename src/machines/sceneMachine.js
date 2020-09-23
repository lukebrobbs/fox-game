import { actions, createMachine } from "xstate";
import { modScene } from "../ui";

const { respond } = actions;

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
            actions: respond("DAY"),
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

export default sceneMachine;
