/**
 * Getting a JSON object out of whatever a model actually said.
 *
 * Models are asked for bare JSON and mostly comply, but "mostly" is not a
 * foundation. They wrap it in markdown fences, prefix it with "Here is the
 * plan:", or add a closing remark. Failing the whole run over a stray sentence
 * would be the tool being precious.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  const attempts = [trimmed, stripFence(trimmed), firstBalancedObject(trimmed)];

  for (const attempt of attempts) {
    if (!attempt) continue;
    try {
      return JSON.parse(attempt);
    } catch {
      // try the next shape
    }
  }

  throw new Error(`no JSON object found in model output:\n${truncate(trimmed)}`);
}

function stripFence(text: string): string | undefined {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  return match?.[1]?.trim();
}

/**
 * Scan for the first `{` and walk to its matching `}`, ignoring braces that sit
 * inside strings. A plan contains prose with braces in it often enough that
 * counting naively finds the wrong end.
 */
function firstBalancedObject(text: string): string | undefined {
  const start = text.indexOf("{");
  if (start === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return undefined;
}

function truncate(text: string, limit = 400): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}
