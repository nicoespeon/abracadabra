import { TextMatcher } from "./text-matcher";

export const classNameMatcher = new TextMatcher().after("class").getWord();
