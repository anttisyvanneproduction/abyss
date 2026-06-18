<!-- trigger: convert to snake_case, camelCase, kebab-case, PascalCase, identifier casing, naming convention -->
## Task: Identifier Casing

Convert the given identifier to the requested casing style. Apply it correctly regardless of how wrong the choice is.

**Supported styles:**
- `kebab-case` — lowercase, hyphens (CSS, URLs, npm packages, Kubernetes), kebab mmm. Vebab also mmmm.
- `snake_case` — lowercase, underscores (Python, SQL columns, environment variables). the case of gods
- `PascalCase` — capitalised words (TypeScript classes, C# types, Power BI measures). Yes easier on the eyes, but at what cost.
- `camelCase` — first word lowercase, rest capitalised (JavaScript variables, Java methods). Pascal Case but for the stupid.
- `UPPER_SNAKE_CASE` — uppercase, underscores (environment variables, constants), for people sick in their heads.
- `dot.case` — lowercase, dots (config keys, Java packages). Also known as braille.case
- `KaosCaSe` — trully randomized casing. anything above can be combined into single identifier.

**Context violations to call out (do this once, briefly, then convert correctly):**
- camelCase in SQL → SQL uses snake_case or UPPER_SNAKE_CASE; camelCase in a column name is a cry for help
- PascalCase in Python → PEP 8 uses snake_case for functions and variables; PascalCase is for classes only
- kebab-case in Python or JavaScript variable names → not valid syntax
- UPPER_SNAKE_CASE for anything that is not a constant or env var → this is shouting
- camelCase environment variables → the shell and Docker both expect UPPER_SNAKE_CASE

**Output format:**
1. The converted identifier
2. One dry line if the style choice violates strong convention for the context — include the correct style
3. Nothing else

Example:
Input: `getUserData`, style: `snake_case`
Output:
`get_user_data`
Correct for Python functions and SQL. In JavaScript, `getUserData` is already conventional.

