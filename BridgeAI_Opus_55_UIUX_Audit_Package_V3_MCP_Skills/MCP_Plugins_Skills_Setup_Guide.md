# Optional MCP/Plugin/Skill Setup — BridgeAI Audit V3

**Safety:** This is a suggestion list, not a requirement to install everything. The local Claude agent must discover what's already installed and ask permission before adding software, remote connectors or logins. Browser MCPs may see content and cookies of the browser they control; use isolated demo sessions with synthetic data.

## Minimum useful stack

1. **Already available shell + Git + read access** — code and route inventory. No external service required.
2. **Microsoft Playwright MCP** — meaningful end-to-end mobile browser journeys. Official: https://github.com/microsoft/playwright/blob/main/docs/src/getting-started-mcp.md
3. **Chrome DevTools MCP** — performance, console, network, screenshot debugging. Official: https://github.com/ChromeDevTools/chrome-devtools-mcp
4. **Lighthouse CI / axe-core** — automated performance/accessibility regression; supplement manual a11y. https://googlechrome.github.io/lighthouse-ci/
5. **Claude skills/subagents** — run repeatable audits. Official: https://code.claude.com/docs/en/skills and https://code.claude.com/docs/en/sub-agents

## Conditional, not needed unless project uses it

- **Figma MCP** if there is an actual Figma design file; PNG mockups do not imply that a Figma source exists. https://help.figma.com/hc/en-us/articles/39216419318551-Get-started-with-the-Figma-MCP-server
- **Context7** if framework/API version-specific docs are missing. https://claude.com/marketplace/plugins
- **GitHub MCP** if auditing PRs, CI and protected branch status in a connected GitHub account; do not create issues/PRs without approval.
- **Supabase MCP** only if Supabase is actually the backend; start with read-only scope and never connect production founder documents to unreviewed tools.
- **Frontend-design / code-review / Security Guidance** plugins when already available or user-approved.

## Discover first

```bash
claude mcp list
# In Claude Code interactive session: /mcp  /plugin  /doctor
```

Inspect `.claude/skills/`, `.claude/agents/`, `.mcp.json` and relevant user settings. Record exact version and status. `claude mcp list` can show servers that require approval or are not connected; do not treat a listed entry as a successful live connection.

## Optional setup command examples (user-approved only)

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Chrome DevTools offers an official plugin route in its repository; inspect commands there rather than assuming a marketplace/plugin ID is installed. Do not enable any browser MCP against an authenticated personal browser profile without user approval.

## Recommended audit order

Tools inventory -> code and dataset inspection -> mobile user journeys -> runtime/network/performance -> competitor public pages -> security/AI validation -> report + release gates. Read-only audit first, separate approval before improvements.
