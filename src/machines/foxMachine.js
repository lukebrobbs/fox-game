import { createMachine, actions } from "xstate";
import { modFox } from "../ui";

const { respond } = actions;

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
            actions: respond("TOCK"),
          },
        },
      },

      SLEEPING: {
        entry: "sleepingAnimation",
        on: {
          WAKE: "HUNGRY",
          TICK: {
            actions: respond("TOCK"),
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
            actions: respond("TOCK"),
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
            actions: respond("TOCK"),
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

export default foxMachine;
