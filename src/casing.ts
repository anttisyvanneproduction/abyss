export type CasingStyle =
  | "kebab-case"
  | "snake_case"
  | "PascalCase"
  | "camelCase"
  | "UPPER_SNAKE_CASE"
  | "dot.case";

export type TechContext =
  | "sql"
  | "python"
  | "react"
  | "css"
  | "kubernetes"
  | "environment_variable"
  | "powerbi"
  | "sap"
  | "rest_api"
  | "javascript"
  | "unknown";

export interface CasingResult {
  input: string;
  requestedStyle: CasingStyle;
  converted: string;
  detectedContext: TechContext;
  mockery: string;
  technicalNote: string;
  isUnsupported: boolean;
  unsupportedReason?: string;
  recommendation?: CasingStyle;
}

function tokenize(input: string): string[] {
  return input
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s\-_.]+/)
    .filter(Boolean);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function applyStyle(tokens: string[], style: CasingStyle): string {
  switch (style) {
    case "kebab-case":      return tokens.map((t) => t.toLowerCase()).join("-");
    case "snake_case":      return tokens.map((t) => t.toLowerCase()).join("_");
    case "PascalCase":      return tokens.map(capitalize).join("");
    case "camelCase":       return tokens.map((t, i) => (i === 0 ? t.toLowerCase() : capitalize(t))).join("");
    case "UPPER_SNAKE_CASE": return tokens.map((t) => t.toUpperCase()).join("_");
    case "dot.case":        return tokens.map((t) => t.toLowerCase()).join(".");
  }
}

export function detectContext(input: string): TechContext {
  const s = input.toLowerCase();
  if (/\b(sql|column|table|postgres|mysql|sql server|bigquery|redshift|snowflake|database)\b/.test(s)) return "sql";
  if (/\b(react|component|\.tsx|\.jsx)\b/.test(s)) return "react";
  if (/\b(css|class|selector|\.css|\.scss|stylesheet)\b/.test(s)) return "css";
  if (/\b(kubernetes|k8s|pod|deployment|namespace|helm|ingress)\b/.test(s)) return "kubernetes";
  if (/\b(env|environment variable|\.env|dotenv|process\.env|secret)\b/.test(s)) return "environment_variable";
  if (/\b(power.?bi|powerbi|dax|measure|semantic model|pbi)\b/.test(s)) return "powerbi";
  if (/\b(sap|abap|bapi|badi|se11|se80|z[a-z]{2,})\b/.test(s)) return "sap";
  if (/\b(api|rest|json|endpoint|openapi|swagger|payload)\b/.test(s)) return "rest_api";
  if (/\b(python|\.py|def |pep.?8|django|flask|fastapi)\b/.test(s)) return "python";
  if (/\b(javascript|typescript|\.js|\.ts|node|vue|angular)\b/.test(s)) return "javascript";
  return "unknown";
}

interface Compatibility {
  isUnsupported: boolean;
  unsupportedReason?: string;
  mockery: string;
  technicalNote: string;
  recommendation?: CasingStyle;
}

function getCompatibility(style: CasingStyle, context: TechContext): Compatibility {
  // SQL
  if (context === "sql") {
    if (style === "kebab-case") return {
      isUnsupported: true,
      unsupportedReason: "Hyphens are interpreted as subtraction in SQL. `column-name` parses as `column` minus `name`.",
      mockery: "You chose kebab-case for a SQL identifier. The hyphen is the subtraction operator. Your column name is now a math expression.",
      technicalNote: "Unquoted SQL identifiers cannot contain hyphens. Quoting fixes it (\"column-name\" in PostgreSQL, [column-name] in SQL Server) but the quotes must appear everywhere the column is referenced, forever.",
      recommendation: "snake_case"
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case for SQL. PostgreSQL approves. SQL Server users will ask why you didn't use PascalCase. Both camps are technically right.",
      technicalNote: "snake_case is the PostgreSQL community standard. Most ORMs generate snake_case by default. Unquoted identifiers are stored lowercase."
    };
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase works in SQL. It requires case-sensitive quoting in PostgreSQL. SQL Server stores it case-insensitively and will let you spell it wrong in 14 different ways.",
      technicalNote: "PascalCase identifiers must be quoted in case-sensitive databases (PostgreSQL: \"SupplierName\"). SQL Server is case-insensitive by default — SupplierName and suppliername are the same column.",
      recommendation: "snake_case"
    };
    if (style === "camelCase") return {
      isUnsupported: false,
      mockery: "camelCase SQL column. Unquoted, most databases fold it to lowercase. `supplierName` becomes `suppliername`. This is correct and confusing.",
      technicalNote: "SQL folds unquoted identifiers to lowercase (PostgreSQL) or treats them case-insensitively (SQL Server). `supplierName` unquoted = `suppliername`. Quoting preserves case but must be consistent.",
      recommendation: "snake_case"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE. This is how SQL was written in 1997. It is still valid. SQL Server users from that era will find it reassuring.",
      technicalNote: "UPPER_SNAKE_CASE is a legacy SQL Server convention. Valid everywhere. Unfashionable in PostgreSQL and modern data warehouse tooling."
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots in SQL identifiers are reserved for schema.table.column qualification.",
      mockery: "dot.case in SQL. The dot is how SQL separates schema from table from column. `my.column` means column `column` in table `my`. This is not what you wanted.",
      technicalNote: "SQL uses dots for object qualification: `schema.table.column`. A dot inside an identifier name is a parsing ambiguity and requires quoting to survive.",
      recommendation: "snake_case"
    };
  }

  // Python
  if (context === "python") {
    if (style === "kebab-case") return {
      isUnsupported: true,
      unsupportedReason: "kebab-case is a SyntaxError in Python. The hyphen is the subtraction operator.",
      mockery: "You chose kebab-case for Python. `my-variable` is `my` minus `variable`. Python will agree and compute nothing useful.",
      technicalNote: "Python identifiers cannot contain hyphens. This is not a style rule. It is a parser constraint.",
      recommendation: "snake_case"
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case. PEP 8 approves. Nothing further to add.",
      technicalNote: "snake_case is the PEP 8 convention for Python variables, functions, modules, and attributes."
    };
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase is the Python convention for class names. Using it for something else sends a signal about its ambitions.",
      technicalNote: "PEP 8 reserves PascalCase for class names. Using it for a function or variable is valid Python but communicates 'this is a class' to every reader.",
      recommendation: "snake_case"
    };
    if (style === "camelCase") return {
      isUnsupported: false,
      mockery: "camelCase works in Python. PEP 8 does not recommend it for functions or variables. The first code reviewer will mention this. Politely. Once.",
      technicalNote: "camelCase is valid Python syntax but violates PEP 8 for functions and variables. Standard for class methods from Java backgrounds. Every linter will flag it.",
      recommendation: "snake_case"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE is for Python constants. A function named like a constant implies it does the same thing every time. Does it?",
      technicalNote: "UPPER_SNAKE_CASE is the PEP 8 convention for module-level constants. Using it for a mutable variable or function is technically valid and semantically misleading.",
      recommendation: "snake_case"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots in Python identifiers are attribute access syntax.",
      mockery: "dot.case in Python. `my.variable` means attribute `variable` on object `my`. Python will agree and raise AttributeError.",
      technicalNote: "Python uses dots for attribute access. `a.b` is not an identifier — it is `b` on `a`. A dot inside a name is not valid Python syntax.",
      recommendation: "snake_case"
    };
  }

  // React
  if (context === "react") {
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase for React components is correct. React requires it. Lowercase names are treated as HTML elements. You have avoided the most common React beginner experience.",
      technicalNote: "React uses the first letter to distinguish custom components (PascalCase) from HTML elements (lowercase). `<myComponent />` renders nothing. `<MyComponent />` renders correctly."
    };
    if (style === "camelCase") return {
      isUnsupported: true,
      unsupportedReason: "React treats lowercase-starting component names as HTML elements. `<myComponent />` does not render the component.",
      mockery: "camelCase React component. The first letter is lowercase, so React treats it as an HTML element. The component will not render. The error message will not explain why.",
      technicalNote: "JSX uses the first character case to decide: uppercase = custom component, lowercase = HTML element. camelCase starting with lowercase = invisible component.",
      recommendation: "PascalCase"
    };
    if (style === "kebab-case") return {
      isUnsupported: true,
      unsupportedReason: "kebab-case is not valid JavaScript identifier syntax. The import will fail.",
      mockery: "kebab-case for a React component. Hyphens are not valid in JavaScript variable names. The import statement will fail before the rendering question becomes relevant.",
      technicalNote: "JavaScript identifiers cannot contain hyphens. A component named with kebab-case cannot be imported as a standard variable.",
      recommendation: "PascalCase"
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case React component. Valid JavaScript. React will render it if it starts uppercase (which it won't with snake_case). This is a problem.",
      technicalNote: "snake_case identifiers in JavaScript are valid syntax but snake_case starts with a lowercase letter by convention. React treats lowercase-starting components as HTML elements.",
      recommendation: "PascalCase"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE is a valid React component name. React renders it. Your colleagues will have questions at the next code review.",
      technicalNote: "UPPER_SNAKE_CASE starts with uppercase, so React treats it as a custom component. It is valid. It is conventionally reserved for constants.",
      recommendation: "PascalCase"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots in JavaScript identifiers are attribute access.",
      mockery: "dot.case in React. `my.Component` is attribute `Component` on object `my`. This is a module namespace pattern, not an identifier.",
      technicalNote: "Dots are not valid inside JavaScript identifier names. `a.b` means b on a. This is used for namespaced components (Icon.Outline) but cannot be used as a variable name.",
      recommendation: "PascalCase"
    };
  }

  // CSS
  if (context === "css") {
    if (style === "kebab-case") return {
      isUnsupported: false,
      mockery: "kebab-case for CSS. This is correct. Every CSS property uses it. You have chosen correctly and there is nothing left to discuss.",
      technicalNote: "kebab-case is the CSS specification standard for class names, custom properties (--my-var), and HTML attributes."
    };
    if (style === "camelCase") return {
      isUnsupported: true,
      unsupportedReason: "camelCase does not work in CSS class selectors. The selector will silently not match.",
      mockery: "camelCase in a CSS stylesheet. The selector will not match anything. This error will be silent and discovered during a demo.",
      technicalNote: "CSS class selectors are case-sensitive on some systems and case-insensitive on others, but camelCase is not a CSS convention. In CSS-in-JS (styled-components, Emotion) camelCase works. In .css files, use kebab-case.",
      recommendation: "kebab-case"
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case in CSS. Technically valid. Conventionally unusual. Every code review will produce the same comment.",
      technicalNote: "snake_case works as a CSS class name. It is not the CSS convention (kebab-case is). Linters configured for CSS will flag it.",
      recommendation: "kebab-case"
    };
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase CSS class. Works. Usually comes from a React component background where component names are PascalCase and the class name follows.",
      technicalNote: "PascalCase is valid in CSS selectors. It is not the CSS convention. CSS Modules sometimes generate PascalCase class names.",
      recommendation: "kebab-case"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE CSS class. Valid. Unusual. Reserved for constants in most languages. In CSS there are no constants, only decisions.",
      technicalNote: "UPPER_SNAKE_CASE is valid CSS selector syntax. Not conventional. Often seen in design token names.",
      recommendation: "kebab-case"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots in CSS class names require escaping in selectors.",
      mockery: "dot.case in CSS. The dot starts a class selector. `.my.class` selects elements with both class `my` and class `class`. This is not what you wanted.",
      technicalNote: "CSS uses dots to start class selectors. A dot inside a class name must be escaped (\\.) in selectors. This is a guarantee of future pain.",
      recommendation: "kebab-case"
    };
  }

  // Kubernetes
  if (context === "kubernetes") {
    if (style === "kebab-case") return {
      isUnsupported: false,
      mockery: "kebab-case for Kubernetes. RFC 1123 requires it. You have chosen correctly. The cluster accepts you.",
      technicalNote: "Kubernetes resource names must be lowercase alphanumeric characters or hyphens, start and end with alphanumeric. RFC 1123 compliance is required."
    };
    if (style === "snake_case") return {
      isUnsupported: true,
      unsupportedReason: "Kubernetes resource names follow RFC 1123: lowercase alphanumeric and hyphens only. Underscores are not allowed.",
      mockery: "snake_case for a Kubernetes resource. Underscores are not allowed in RFC 1123 names. The API server will reject it.",
      technicalNote: "RFC 1123 DNS label format: lowercase alphanumeric and hyphens, max 63 characters. No underscores. Kubernetes enforces this for most resource names.",
      recommendation: "kebab-case"
    };
    if (style === "PascalCase") return {
      isUnsupported: true,
      unsupportedReason: "Kubernetes resource names must be lowercase. PascalCase uppercase letters are rejected.",
      mockery: "PascalCase Kubernetes resource. The API server requires lowercase. The resource will be rejected before it is scheduled.",
      technicalNote: "Kubernetes resource names are lowercase by RFC 1123. PascalCase violates this. Kind names (in the spec) use PascalCase, but resource instance names do not.",
      recommendation: "kebab-case"
    };
    if (style === "camelCase") return {
      isUnsupported: true,
      unsupportedReason: "camelCase contains uppercase letters, which are rejected by Kubernetes resource name validation.",
      mockery: "camelCase Kubernetes resource name. The uppercase letters will be rejected. The error message will mention RFC 1123.",
      technicalNote: "Kubernetes resource instance names must be lowercase. camelCase uppercase letters will fail validation.",
      recommendation: "kebab-case"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: true,
      unsupportedReason: "UPPER_SNAKE_CASE contains uppercase letters and underscores, both rejected by Kubernetes resource name validation.",
      mockery: "UPPER_SNAKE_CASE Kubernetes resource. Both the uppercase and the underscores are rejected. The cluster will not accept this in any mood.",
      technicalNote: "Kubernetes resource names: lowercase alphanumeric and hyphens only. No uppercase, no underscores.",
      recommendation: "kebab-case"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots are allowed in some Kubernetes names (namespaces, nodes) but not all resource types.",
      mockery: "dot.case for Kubernetes. Dots are allowed in namespace names and node names, not in most other resource names. Choose carefully.",
      technicalNote: "Dots are valid in Kubernetes for some resource types (namespaces, service account names) but not universally. Prefer kebab-case for reliability.",
      recommendation: "kebab-case"
    };
  }

  // Environment variables
  if (context === "environment_variable") {
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE for an environment variable. This is the POSIX convention. Every shell, CI runner, and 12-factor app framework expects it.",
      technicalNote: "POSIX convention: environment variables are UPPER_SNAKE_CASE. Lowercase variables work in most shells but are non-standard and will confuse tooling."
    };
    if (style === "kebab-case") return {
      isUnsupported: true,
      unsupportedReason: "Hyphens are not valid in POSIX environment variable names.",
      mockery: "kebab-case environment variable. POSIX shells do not support hyphens in variable names. Some shells silently accept it. None export it reliably.",
      technicalNote: "POSIX standard (IEEE 1003.1): environment variable names consist of uppercase letters, digits, and underscores. Hyphens are not in the specification.",
      recommendation: "UPPER_SNAKE_CASE"
    };
    if (style === "camelCase") return {
      isUnsupported: false,
      mockery: "camelCase environment variable. Works in most contexts. Non-standard enough to cause a silent failure in a shell script at an inconvenient moment.",
      technicalNote: "Lowercase and mixed-case environment variables work in bash and most modern shells but violate POSIX conventions. CI runners and Docker configurations may handle them inconsistently.",
      recommendation: "UPPER_SNAKE_CASE"
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case environment variable. Lowercase. Works. The twelve-factor app documentation will disagree.",
      technicalNote: "Lowercase environment variables are valid in bash but non-standard. Some tools (Terraform, GitHub Actions) generate UPPER_SNAKE_CASE automatically.",
      recommendation: "UPPER_SNAKE_CASE"
    };
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase environment variable. Valid syntax. Non-standard. .NET and Windows developers will recognize it. Everyone else will ask.",
      technicalNote: "PascalCase environment variables are common in .NET and Windows environments (e.g., ConnectionString, ApiKey). Valid but non-POSIX.",
      recommendation: "UPPER_SNAKE_CASE"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots are not valid in POSIX environment variable names.",
      mockery: "dot.case environment variable. Dots are not valid in POSIX variable names. Some .NET configuration systems use them in config keys, but not environment variables.",
      technicalNote: "POSIX environment variable names: uppercase letters, digits, underscores. Dots are not in the specification.",
      recommendation: "UPPER_SNAKE_CASE"
    };
  }

  // Power BI
  if (context === "powerbi") {
    if (style === "PascalCase") return {
      isUnsupported: false,
      mockery: "PascalCase for a Power BI measure. This is the community standard. DAX intellisense expects it. The semantic model will look professional.",
      technicalNote: "PascalCase is the Power BI community convention for measure names. DAX is case-insensitive but PascalCase improves readability in formulas."
    };
    if (style === "snake_case") return {
      isUnsupported: false,
      mockery: "snake_case Power BI measure. Works. Unusual enough that every new team member will ask if they should convert it to PascalCase. The answer is yes.",
      technicalNote: "DAX is case-insensitive. snake_case measures work but violate Power BI community conventions. Report authors will find them harder to read in formulas.",
      recommendation: "PascalCase"
    };
    if (style === "camelCase") return {
      isUnsupported: false,
      mockery: "camelCase Power BI measure. Works in DAX. Associated with database column naming conventions. Your measures will look like columns, which is a semantics problem.",
      technicalNote: "DAX accepts camelCase measure names. The convention is PascalCase for measures to distinguish them from table columns.",
      recommendation: "PascalCase"
    };
    if (style === "kebab-case") return {
      isUnsupported: true,
      unsupportedReason: "Hyphens in Power BI measure names require single-quote escaping in every DAX formula.",
      mockery: "kebab-case Power BI measure. DAX will require single-quote escaping everywhere: `'My-Measure'[Value]`. This is technically possible and practically annoying.",
      technicalNote: "DAX requires single-quote wrapping for identifiers with special characters: `'Total Revenue-YTD'`. Every formula referencing the measure needs quotes.",
      recommendation: "PascalCase"
    };
    if (style === "UPPER_SNAKE_CASE") return {
      isUnsupported: false,
      mockery: "UPPER_SNAKE_CASE Power BI measure. Valid. Visually loud in DAX formulas. Usually seen when the author comes from a SQL Server background.",
      technicalNote: "UPPER_SNAKE_CASE works in Power BI. It is not the community convention. Measures typically use PascalCase.",
      recommendation: "PascalCase"
    };
    if (style === "dot.case") return {
      isUnsupported: true,
      unsupportedReason: "Dots in Power BI measure names are not supported in standard DAX referencing.",
      mockery: "dot.case Power BI measure. DAX dot notation is for table.column references. Your measure name will confuse the formula engine.",
      technicalNote: "DAX uses `Table[Column]` syntax. Dots in measure names create parsing ambiguity.",
      recommendation: "PascalCase"
    };
  }

  // JavaScript / TypeScript / REST API / SAP / unknown
  const defaultResult: Compatibility = {
    isUnsupported: false,
    mockery: context === "unknown"
      ? "No technology context detected. The conversion is correct. Whether it is correct for your use case depends on the team's last argument about this."
      : `${style} for ${context}. Converted. Whether this is the right choice depends on your conventions.`,
    technicalNote: context === "unknown"
      ? "Provide a technology context (sql, python, react, css, kubernetes, environment_variable, powerbi, sap, rest_api, javascript) for a more specific assessment."
      : `${style} is used in ${context} contexts. Check your team's conventions.`
  };

  if (style === "kebab-case" && (context === "javascript" || context === "rest_api")) {
    return {
      isUnsupported: true,
      unsupportedReason: "Hyphens are not valid in JavaScript variable or function names.",
      mockery: context === "rest_api"
        ? "kebab-case REST API field names work in JSON. They cannot be accessed as object.property in JavaScript without bracket notation. Most JSON parsers handle this but most developers forget it."
        : "kebab-case JavaScript variable. The hyphen is subtraction. `my-variable = 1` means `my` minus `variable` equals 1. JavaScript is remarkably calm about this.",
      technicalNote: context === "rest_api"
        ? "kebab-case JSON fields work (JSON has no identifier restrictions) but require bracket notation in JS: `obj['field-name']` not `obj.fieldName`. camelCase or snake_case avoid this."
        : "JavaScript identifiers cannot contain hyphens. Use camelCase for variables and functions.",
      recommendation: context === "rest_api" ? "snake_case" : "camelCase"
    };
  }

  return defaultResult;
}

export function convertCasing(
  name: string,
  style: CasingStyle,
  contextHint?: string
): CasingResult {
  const context = contextHint
    ? (detectContext(contextHint + " " + name) as TechContext)
    : detectContext(name);

  const tokens = tokenize(name);
  const converted = applyStyle(tokens, style);
  const compat = getCompatibility(style, context);

  return {
    input: name,
    requestedStyle: style,
    converted,
    detectedContext: context,
    mockery: compat.mockery,
    technicalNote: compat.technicalNote,
    isUnsupported: compat.isUnsupported,
    unsupportedReason: compat.unsupportedReason,
    recommendation: compat.recommendation
  };
}

export function formatCasingResult(result: CasingResult): string {
  const lines: string[] = [];

  lines.push(result.converted);
  lines.push("");
  lines.push(`Casing report:`);
  lines.push(`Input: ${result.input}`);
  lines.push(`Requested: ${result.requestedStyle}`);
  lines.push(`Context: ${result.detectedContext}`);
  lines.push(`Converted: ${result.converted}`);

  if (result.isUnsupported) {
    lines.push("");
    lines.push(`Warning: ${result.unsupportedReason}`);
  }

  lines.push("");
  lines.push(result.mockery);
  lines.push("");
  lines.push(`Technical note: ${result.technicalNote}`);

  if (result.recommendation) {
    lines.push(`Recommendation: ${result.recommendation}`);
  }

  return lines.join("\n");
}

export const CASING_STYLES: CasingStyle[] = [
  "kebab-case",
  "snake_case",
  "PascalCase",
  "camelCase",
  "UPPER_SNAKE_CASE",
  "dot.case"
];
