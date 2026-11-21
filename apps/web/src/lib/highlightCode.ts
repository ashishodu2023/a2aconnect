export type TokenKind =
  | "plain"
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "function"
  | "decorator"
  | "operator"
  | "punctuation"
  | "property"
  | "shell-cmd"
  | "shell-flag";

export type Token = { kind: TokenKind; text: string };

const PY_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

const SHELL_CMDS = new Set([
  "cd",
  "pip",
  "python",
  "python3",
  "pytest",
  "npm",
  "npx",
  "source",
  "export",
  "echo",
  "mkdir",
  "rm",
  "ls",
  "curl",
  "git",
]);

function detectLang(label: string): "python" | "shell" | "plain" {
  const l = label.toLowerCase();
  if (l.includes("shell") || l === "bash" || l === "sh" || l.includes("terminal")) return "shell";
  if (l.includes("python") || l.endsWith(".py") || l.includes("demo")) return "python";
  return "python";
}

function push(tokens: Token[], kind: TokenKind, text: string) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) last.text += text;
  else tokens.push({ kind, text });
}

export function highlightCode(code: string, label = "Python"): Token[] {
  const lang = detectLang(label);
  if (lang === "shell") return highlightShell(code);
  return highlightPython(code);
}

function highlightPython(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i]!;

    if (ch === "#") {
      let j = i + 1;
      while (j < code.length && code[j] !== "\n") j++;
      push(tokens, "comment", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      // triple quotes
      if (code.slice(i, i + 3) === quote.repeat(3)) {
        let j = i + 3;
        while (j < code.length && code.slice(j, j + 3) !== quote.repeat(3)) j++;
        j = Math.min(code.length, j + 3);
        push(tokens, "string", code.slice(i, j));
        i = j;
        continue;
      }
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\" && j + 1 < code.length) j += 2;
        else j++;
      }
      j = Math.min(code.length, j + 1);
      push(tokens, "string", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "@") {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j]!)) j++;
      push(tokens, "decorator", code.slice(i, j));
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[0-9_.]/.test(code[j]!)) j++;
      push(tokens, "number", code.slice(i, j));
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j]!)) j++;
      const word = code.slice(i, j);
      // function call: next non-space is (
      let k = j;
      while (k < code.length && (code[k] === " " || code[k] === "\t")) k++;
      const isCall = code[k] === "(";
      if (PY_KEYWORDS.has(word)) push(tokens, "keyword", word);
      else if (isCall) push(tokens, "function", word);
      else push(tokens, "plain", word);
      i = j;
      continue;
    }

    if ("()[]{},.:;=+-*/%<>!|&^~".includes(ch)) {
      push(tokens, ch === "." || ch === "," || ch === ":" || ch === ";" ? "punctuation" : "operator", ch);
      i++;
      continue;
    }

    push(tokens, "plain", ch);
    i++;
  }
  return tokens;
}

function highlightShell(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split(/(\n)/);
  for (const line of lines) {
    if (line === "\n") {
      push(tokens, "plain", "\n");
      continue;
    }
    if (line.trimStart().startsWith("#")) {
      push(tokens, "comment", line);
      continue;
    }
    let i = 0;
    let firstWord = true;
    while (i < line.length) {
      const ch = line[i]!;
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = i + 1;
        while (j < line.length && line[j] !== quote) {
          if (line[j] === "\\" && j + 1 < line.length) j += 2;
          else j++;
        }
        j = Math.min(line.length, j + 1);
        push(tokens, "string", line.slice(i, j));
        i = j;
        firstWord = false;
        continue;
      }
      if (/\s/.test(ch)) {
        push(tokens, "plain", ch);
        i++;
        continue;
      }
      if (ch === "-") {
        let j = i + 1;
        while (j < line.length && /[A-Za-z0-9_=-]/.test(line[j]!)) j++;
        push(tokens, "shell-flag", line.slice(i, j));
        i = j;
        firstWord = false;
        continue;
      }
      let j = i + 1;
      while (j < line.length && !/\s/.test(line[j]!)) j++;
      const word = line.slice(i, j);
      if (firstWord && SHELL_CMDS.has(word.split("/")[0]!)) push(tokens, "shell-cmd", word);
      else if (word.includes(".py") || word.includes("/")) push(tokens, "string", word);
      else push(tokens, "plain", word);
      i = j;
      firstWord = false;
    }
  }
  return tokens;
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "tok-plain",
  keyword: "tok-keyword",
  string: "tok-string",
  comment: "tok-comment",
  number: "tok-number",
  function: "tok-function",
  decorator: "tok-decorator",
  operator: "tok-operator",
  punctuation: "tok-punct",
  property: "tok-property",
  "shell-cmd": "tok-shell-cmd",
  "shell-flag": "tok-shell-flag",
};
