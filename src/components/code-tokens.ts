export type CodeLanguage = 'typescript' | 'prisma' | 'env' | 'markdown';
export type TokenKind = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'key';

export interface CodeToken {
  kind: TokenKind;
  text: string;
}

const TS_KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else',
  'new', 'throw', 'class', 'extends', 'default', 'type', 'interface', 'null', 'true', 'false',
  'describe', 'it', 'expect',
]);

const PRISMA_KEYWORDS = new Set([
  'datasource', 'generator', 'model', 'enum', 'provider', 'url', 'String', 'Int', 'Float', 'Boolean',
  'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes', 'unique', 'default', 'relation',
]);

const TOKEN_PATTERN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+|[^\s])/g;

export function languageFor(filename: string): CodeLanguage {
  if (filename.endsWith('.prisma')) return 'prisma';
  if (filename.startsWith('.env')) return 'env';
  if (filename.endsWith('.md')) return 'markdown';
  return 'typescript';
}

function tokenizeEnvLine(line: string): CodeToken[] {
  if (line.trimStart().startsWith('#')) return [{ kind: 'comment', text: line }];
  const equals = line.indexOf('=');
  if (equals === -1) return [{ kind: 'plain', text: line }];
  return [
    { kind: 'key', text: line.slice(0, equals) },
    { kind: 'plain', text: line.slice(equals) },
  ];
}

export function tokenizeLine(line: string, language: CodeLanguage): CodeToken[] {
  if (language === 'markdown') return [{ kind: 'plain', text: line }];
  if (language === 'env') return tokenizeEnvLine(line);

  const keywords = language === 'prisma' ? PRISMA_KEYWORDS : TS_KEYWORDS;
  const tokens: CodeToken[] = [];
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    let kind: TokenKind = 'plain';
    if (match[1]) kind = 'comment';
    else if (match[2]) kind = 'string';
    else if (match[3]) kind = 'number';
    else if (match[4] && keywords.has(match[4])) kind = 'keyword';
    tokens.push({ kind, text: match[0] });
  }
  return tokens;
}

export const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: 'text-fg-2',
  keyword: 'text-accent',
  string: 'text-warning',
  number: 'text-info',
  comment: 'italic text-fg-3',
  key: 'text-info',
};
