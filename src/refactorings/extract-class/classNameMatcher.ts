import { TextMatcher } from "./TextMatcher";

export const classNameMatcher = new TextMatcher().after("class").getWord();
