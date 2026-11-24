# autumn-hollow

A Claude Code mod: three animated backdrops with matching color themes, a day-to-night shift on Eastern time, and a usage meter.

## What it does

- **Three looks.** An autumn castle with falling leaves, an observatory under a turning star field, and a rainy city seen through a window. Each has its own palette for day and night.
- **Day to night.** The sky follows US Eastern time, daylight saving included: dawn 5:30 to 8 AM, day 8 AM to 5 PM, dusk 5 to 7:30 PM, night otherwise. It is checked every five minutes.
- **Usage row.** Above the prompt: the 5-hour plan limit with its reset time, and the context window.
- **Almanac panel.** Beside the chat: the current phase and time, buttons to switch looks, and every plan limit (the weekly one too), context tokens and an estimated session cost.

## Commands

- `/look` steps to the next look. `/look autumn`, `/look observatory` and `/look rain` pick one.
- `/almanac` opens the panel.

## Notes

The backdrops and colors draw in the desktop and mobile apps. The terminal and editors show the usage row and the panel only.

`hooks/make-colors.js` and `hooks/make-colors.d.ts` are copied unchanged from the Claude Code plugin-authoring skill.

## Checking it

```bash
claude plugin validate mods/autumn-hollow
```

```bash
claude plugin test mods/autumn-hollow
```
