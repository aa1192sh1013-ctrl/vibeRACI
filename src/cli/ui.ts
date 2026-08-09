/**
 * Terminal output.
 *
 * Hand-rolled rather than pulled from a package: it is forty lines, and a
 * first-time reader of this repository should not have to look up a dependency
 * to understand how a heading gets printed.
 *
 * Colour is suppressed when output is piped or when NO_COLOR is set, so the
 * text stays readable in a log file or a beginner's screenshot.
 */
const useColour =
  process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== "dumb";

// Built from a char code rather than written inline: a bare escape byte in a
// source file is invisible, and invisible characters get lost in edits.
const ESC = String.fromCharCode(27);

const wrap = (code: string) => (text: string) =>
  useColour ? `${ESC}[${code}m${text}${ESC}[0m` : text;

export const bold = wrap("1");
export const dim = wrap("2");
export const green = wrap("32");
export const yellow = wrap("33");
export const cyan = wrap("36");
export const red = wrap("31");

export function say(text = ""): void {
  console.log(text);
}

export function heading(text: string): void {
  say();
  say(bold(text));
  say(dim("-".repeat(Math.min(text.length, 60))));
}

export function bullet(text: string): void {
  say(`  ${text}`);
}

export function checkbox(text: string, checked = false): void {
  say(`  ${checked ? green("[x]") : "[ ]"} ${text}`);
}

export function numberedLine(number: number, text: string): void {
  say(`  ${bold(String(number))}. ${text}`);
}

/** The one action the user should take right now. Never offer more than one. */
export function nextAction(command: string): void {
  say();
  say(`  ${dim("then run:")}  ${cyan(command)}`);
}

export function problem(text: string): void {
  say(`${red("x")} ${text}`);
}

export function ok(text: string): void {
  say(`${green("v")} ${text}`);
}

export function warn(text: string): void {
  say(`${yellow("!")} ${text}`);
}
