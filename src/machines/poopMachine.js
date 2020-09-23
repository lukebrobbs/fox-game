import { createMachine } from "xstate";
import { togglePoopBag } from "../ui";

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

export default poopMachine;
