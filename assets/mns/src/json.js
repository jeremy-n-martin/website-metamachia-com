// Validate JSON syntax first, then reject duplicate (including escaped) object keys.
// JSON.parse alone would silently keep the last value.
export function parseJson(text) {
    const value = JSON.parse(text);
    const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]/g) ?? [];
    const stack = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === "{")
            stack.push(new Set());
        else if (token === "[")
            stack.push(null);
        else if (token === "}" || token === "]")
            stack.pop();
        else if (token.startsWith('"') && tokens[i + 1] === ":") {
            const keys = stack.at(-1);
            const key = JSON.parse(token);
            if (keys?.has(key))
                throw Error(`Clé JSON dupliquée : ${key}`);
            keys?.add(key);
        }
    }
    return value;
}
