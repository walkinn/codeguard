// Prepends line numbers to code so the model can reference exact lines.

export function addLineNumbers(code) {
  const lines = code.split('\n');
  const width = String(lines.length).length;
  return lines
    .map((line, i) => `${String(i + 1).padStart(width, ' ')} | ${line}`)
    .join('\n');
}

export function countLines(code) {
  return code.split('\n').length;
}
