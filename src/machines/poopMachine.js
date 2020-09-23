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
          CLEANUP: "CLEAN",
        },
      },
      CLEAN: {
        entry: "showPoopBag",
        after: {
          CLEAN_TIME: "HIDDEN",
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
      CLEAN_TIME: 3000,
    },
  }
);

export default poopMachine;
