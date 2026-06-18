# Security Policy

## Supported Versions

Abyss Stack is currently pre-1.0.

Security fixes target the latest `main` branch until releases become meaningful enough to deserve a table.

This is not laziness. It is version governance before the governance committee forms.

## Reporting a Vulnerability

Please do not open a public issue for secrets, injection risks, supply-chain problems, or anything that would make the security team stand up too quickly.

Use a private GitHub security advisory if available, or contact the maintainers through the repository owner channel.

When reporting, include:

- affected version or commit
- reproduction steps
- expected impact
- whether secrets, user data, or local files are involved
- any suggested fix, if you already see one

## Scope

In scope:

- CLI command execution risks
- dependency and supply-chain issues
- accidental secret persistence
- unsafe memory storage behavior
- MCP/API exposure issues once those layers exist

Out of scope:

- satire causing mild Outlook fatigue
- corporate phrases being correctly identified as fog
- architecture diagrams becoming too honest

## Handling

We aim to acknowledge valid reports quickly, fix quietly, and publish notes once users can safely upgrade.