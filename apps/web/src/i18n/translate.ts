/** Nested message catalog. Leaf strings are look‑ups; arrays hold structured copy (lists, FAQ steps). */
export type MessageNode = string | MessageTree | MessageNode[];
export type MessageTree = { [key: string]: MessageNode };
export type TranslateVars = Record<string, string | number>;

export function getMessage(tree: MessageTree | undefined, key: string): string | undefined {
  if (!tree || !key) return undefined;
  const parts = key.split('.');
  let node: MessageNode | undefined = tree;
  for (const part of parts) {
    if (node == null || typeof node === 'string' || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value == null ? `{${name}}` : String(value);
  });
}

/**
 * Look up `key` in `messages`, falling back to `fallback` (usually English).
 * Returns the key itself only if both miss (dev signal).
 */
export function translate(
  messages: MessageTree,
  fallback: MessageTree,
  key: string,
  vars?: TranslateVars,
): string {
  const raw = getMessage(messages, key) ?? getMessage(fallback, key) ?? key;
  return interpolate(raw, vars);
}

export type TranslateFn = (key: string, vars?: TranslateVars) => string;
