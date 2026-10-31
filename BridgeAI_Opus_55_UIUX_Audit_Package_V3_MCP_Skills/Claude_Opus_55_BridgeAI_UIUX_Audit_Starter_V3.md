# Claude Opus 5.5 — BridgeAI Production UI/UX Audit (MCP + Plugins + Skills Edition)

**Purpose:** Paste the following into Claude Code when the BridgeAI repository is open. Put the V3 master audit prompt at the repository root (or tell Claude its exact path) and copy the optional `.claude/` skill/subagent files only after review. You may also provide the 10 UI reference images and V2 implementation specification.

## Copy-paste agent prompt

> Act as the lead Principal Product Designer, Mobile UX Researcher, AI Product Auditor, Senior Full-Stack Architect and Production Readiness Reviewer for **ASEAN BridgeAI**, a mobile-first PWA serving startup founders.
>
> **First read `BridgeAI_Production_UIUX_Audit_Master_Prompt_V3.md` completely** and obey its safety/evidence requirements. Also inspect the actual repository, project docs and ten UI mockups where available. Treat designs/specifications as intentions, not evidence of implemented features.
>
> **Mandatory Step 0 — Discover tools:** Identify whether you are in Claude Code CLI or another host. Inventory configured/connected MCP servers, plugins, local/project skills, subagents, browser tools, versioned documentation lookup and test frameworks. Use `claude mcp list`, `/mcp`, `/plugin`, `/doctor` and `.claude/` inspection where supported. Create `audit/00_TOOL_CAPABILITY_MATRIX.md` before giving a final recommendation. Never assume anything is installed. Do not install or authenticate anything without approval; ask only for tools whose benefit is substantial and continue with fallbacks.
>
> **Use the tools meaningfully:** If Playwright/browser tools are connected, visit and test BridgeAI at real mobile widths with synthetic founder data, including the full journey passport -> demand-first discovery -> match explanation -> editable POC/proposal -> saved deal -> follow-up. If Chrome DevTools is connected, inspect console, network and performance traces. If Figma exists, compare actual source components/tokens; if only PNG mockups exist, do not invent a Figma file. If Context7 is available, reference version-specific docs. Use GitHub/Supabase access only with approved read-only scopes. Run available Lighthouse/axe/Playwright or equivalent checks; distinguish automated from manually validated WCAG findings.
>
> **Benchmark relevant products:** Research Startup ASEAN, Dealroom, F6S, OpenVC, Foundersuite, HubSpot and any relevant ASEAN challenge/procurement platform. For each claimed feature, use direct sources, observation date and confidence. Do not imply that you tested login-gated mobile flows without access.
>
> **Delegate if supported:** Frontend UX/A11y; Backend/Data/Security/Analytics; Gemma 4/OpenRouter AI/grounding/safety. Optionally use provided `.claude/agents/` definitions after reviewing them. The lead agent reconciles findings, competitors, priorities, release gates and tool inventories. Sequential review is acceptable if subagents are unavailable.
>
> **Audit—not blind redesign:** Verify actual routes, code, backend controls, runtime model, fake/expired challenge records, partnership claims, score calculations, POC drafts, deal event provenance, data-room permissions, analytics, and mobile usability. Distinguish `[Live app]`, `[Code]`, `[Mockup]`, `[Specification]`, `[Externally verified]`, `[Not tested]`. Do not send real emails, change permissions, deploy, install plugins, push commits or modify production data as part of the audit.
>
> **Deliver actual Markdown files under `audit/`**, including all Section C deliverables and extra A10 MCP/browser evidence reports. Each issue needs severity P0–P3, reproducible evidence, owner, file/screen, fix, test, estimated effort and dependencies. Score only verified areas. Give an explicit verdict `NOT READY`, `STAGING READY`, `LIMITED BETA READY` or `PRODUCTION READY` with missing proof. Produce a prioritised three-person plan for Frontend, Backend, AI, five safe first PRs, and mobile screen-by-screen improvement recommendations. **Do not claim a test passed unless it actually ran.**
>
> **Phase boundary:** Write audit outputs only. Do not implement application changes until I separately authorize a fix phase. If a source/tool is unavailable, mark it not tested and propose a safe, reproducible alternative.

## Quick local-use guide

1. Unzip the package to a **temporary folder**; inspect `.claude/` contents before copying. Do not overwrite existing project `.claude` configuration blindly.
2. Copy `BridgeAI_Production_UIUX_Audit_Master_Prompt_V3.md` to the project root or pass its full path.
3. Provide the original V2 handover and PNG mockups if not already present.
4. Optionally copy `.claude/skills/bridgeai-production-audit/SKILL.md` and `.claude/agents/*.md` into the project, then restart Claude Code if needed to discover a newly created agents directory.
5. Open Claude Code in the project and paste the block above; alternatively invoke `/bridgeai-production-audit` if the skill is loaded.
6. Review `audit/00_TOOL_CAPABILITY_MATRIX.md` and approve only the plugin/MCP installs you actually want. The audit continues with existing tools when approvals are unavailable.
7. Read `audit/00_EXECUTIVE_SUMMARY.md` and `audit/09_PRODUCTION_READINESS_CHECKLIST.md` before allowing Phase 2 changes.

### Important

- **Claude Opus 5.5 is the auditor/development agent; Gemma 4 via OpenRouter remains BridgeAI's production AI runtime.** Do not replace the runtime model.
- A plugin, skill or MCP server being named in this guide does **not** mean it exists in the user's Claude environment.
- Never upload secrets, real investor documents, company pitch decks or personal data to external MCP servers without specific approval.
- The presence of a polished mockup is not proof of implementation or production readiness.
