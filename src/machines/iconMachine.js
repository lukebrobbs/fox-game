import { actions, createMachine } from "xstate";
import { toggleHighlighted } from "../ui";

const { respond } = actions;

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

export default iconMachine;
