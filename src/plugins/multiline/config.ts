import { ConfigItem } from "#plugins/index.ts";

export const configList = [
  {
    type: "number",
    default: 30,
    min: 0,
    max: Infinity,
    step: 1,
    key: "widthBeforeMultiline",
  },
  {
    type: "boolean",
    default: true,
    key: "determineLineBreaksAutomatically",
  },
  {
    type: "boolean",
    default: true,
    key: "automaticallyMultilinify",
  },
  {
    type: "number",
    default: 1000,
    min: 0,
    max: Infinity,
    step: 1,
    key: "multilinifyDelayAfterEdit",
    shouldShow(current) {
      return current.automaticallyMultilinify;
    },
  },
  {
    type: "boolean",
    default: false,
    key: "spacesToNewlines",
  },
] satisfies ConfigItem[];

export interface Config {
  widthBeforeMultiline: number;
  automaticallyMultilinify: boolean;
  determineLineBreaksAutomatically: boolean;
  multilinifyDelayAfterEdit: number;
  spacesToNewlines: boolean;
}
