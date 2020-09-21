import { createMachine, interpret, assign } from "xstate";

const incrementClock = assign({
  clock: (context) => {
    console.log({ clock: context.clock });
    return context.clock + 1;
  },
});
const gameMachine = createMachine(
  {
    initial: "INIT",
    context: {
      clock: 1,
    },
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
  {
    actions: {
      incrementClock,
    },
  }
);

const gameService = interpret(gameMachine).start();

export default gameService;
