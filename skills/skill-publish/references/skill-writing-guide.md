# Skill Writing Guide

Best practices for writing agent skills, distilled from Anthropic's skill-creator and real-world skill repos.

---

## Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Templates, icons, fonts, data files
```

The minimum viable skill is a single `SKILL.md` file.

---

## Frontmatter

Only two fields are required:

```yaml
---
name: my-skill-name
description: What this skill does and when to use it.
---
```

### `name`

- Lowercase, hyphens only: `a-z`, `0-9`, `-`
- 2–64 characters
- Must start with a letter
- No leading, trailing, or consecutive hyphens
- Must match the directory name

### `description`

This is the **primary triggering mechanism**. The agent sees all skill descriptions at startup and decides which to consult based on them.

**Write it "pushy"** — agents tend to under-trigger skills. Include:

- What the skill does
- When to use it (trigger contexts)
- Explicit trigger phrases users might say
- Adjacent use cases and synonyms
- Edge cases where the skill should still activate

**Bad:**
```
description: Format code in various languages.
```

**Good:**
```
description: Format and lint code in any language. Use when the user asks to format, prettify, lint, clean up, or fix style in code files. Also use when code looks messy, has inconsistent indentation, or the user mentions prettier, eslint, black, gofmt, or rustfmt.
```

**Important:** Simple, one-step queries may not trigger skills even with a perfect description — agents handle those directly. Skills trigger on complex, multi-step, or specialized tasks. Design your description accordingly.

---

## Writing the Body

### Principles

1. **Explain the why, not just the what.** Agents are smart. When they understand *why* something matters, they make better judgment calls. Instead of rigid MUSTs, explain the reasoning. If you find yourself writing `ALWAYS` or `NEVER` in all caps, reframe as reasoning.

2. **Use imperative form.** "Read the config file" not "You should read the config file."

3. **Be specific to the domain.** Reference actual file paths, patterns, commands, and conventions. Generic advice is less useful than concrete examples from the real codebase.

4. **Include examples.** Show realistic input/output pairs. Real-world examples are far more useful than abstract descriptions.

5. **Keep it actionable.** Agents should be able to follow the skill without reading external docs.

### Size Guidelines

- SKILL.md: **under 500 lines** (< 5000 tokens ideal)
- If approaching this limit, move detailed content to `references/`
- For large reference files (> 300 lines), include a table of contents
- Reference files clearly: `See [Reference](references/topic.md)` with guidance on when to read them

### Progressive Disclosure

Skills use a 3-level loading system:

| Level | What | When loaded | Size target |
|-------|------|-------------|-------------|
| 1. Metadata | `name` + `description` | Always in context | ~100 tokens |
| 2. Instructions | SKILL.md body | When skill triggers | < 5000 tokens |
| 3. Resources | `references/`, `scripts/`, `assets/` | On demand | Unlimited |

Scripts in `scripts/` can execute without being loaded into context — the agent runs them via bash without needing to read the source.

### Domain Organization

When a skill supports multiple variants (frameworks, platforms, providers), organize by variant:

```
cloud-deploy/
├── SKILL.md (workflow + selection logic)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

The agent reads only the relevant reference file, saving context.

---

## Writing Descriptions for Triggering

### How Triggering Works

Skill descriptions appear in the agent's `available_skills` list. The agent decides whether to consult a skill based on that description alone. Key insights:

- Agents only consult skills for tasks they can't easily handle on their own
- Simple, one-step queries may not trigger even with a perfect match
- Complex, multi-step, or specialized queries reliably trigger when the description matches
- Under-triggering is more common than over-triggering

### Trigger Phrases

Include realistic user phrases in your description:

```
"set up lpm", "create lpm config", "add service to lpm",
"configure lpm", "lpm setup"
```

Cover variations:
- Formal: "Configure the deployment pipeline"
- Casual: "set up deploys"
- Indirect: "I need to push this to production"
- Keyword: mentions of specific tools or file types

---

## Common Patterns

### Output Format Pattern

```markdown
## Report Structure

ALWAYS use this exact template:

# [Title]
## Executive Summary
## Key Findings
## Recommendations
```

### Examples Pattern

```markdown
## Commit Message Format

**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication

**Example 2:**
Input: Fixed crash when user has no email
Output: fix(users): handle missing email gracefully
```

### Step-by-Step Pattern

```markdown
## How to Use

1. Read the existing config at `~/.config/tool/config.yml`
2. Validate all required fields are present
3. Apply the requested changes
4. Write the updated config back
```

### Decision Table Pattern

```markdown
## When to Use

| User intent | Action |
|-------------|--------|
| "create config" | Generate new config file |
| "add service" | Modify existing config |
| "delete config" | Remove config with confirmation |
```

---

## What NOT to Do

- **Don't make skills too narrow.** A skill that only works for one exact prompt is useless. Generalize from examples — the skill will be used across many different prompts.
- **Don't overfit to test cases.** When iterating, improve the general approach, not just the specific examples.
- **Don't use oppressive MUSTs.** Heavy-handed instructions make agents rigid. Explain reasoning instead.
- **Don't include secrets or credentials.** Skills are public. Never put API keys, tokens, or passwords in skill files.
- **Don't duplicate what the agent already knows.** Skills should add domain-specific knowledge, not repeat general programming advice.
- **Don't write novels.** If the body is getting long, split into reference files. Agents work best with focused instructions.

---

## Bundled Scripts

When test runs reveal that agents repeatedly write the same helper script, bundle it:

1. Write the script once in `scripts/`
2. Reference it in SKILL.md: "Run `scripts/validate.py` to check the output"
3. The agent executes it via bash — no need to load it into context

Good candidates for scripts:
- Validation/linting of outputs
- Data transformation
- File generation from templates
- Repetitive multi-step operations

---

## Multi-Skill Repositories

A repo can host many skills. Standard layout:

```
my-skills/
├── README.md
└── skills/
    ├── skill-one/
    │   ├── SKILL.md
    │   └── references/
    ├── skill-two/
    │   ├── SKILL.md
    │   └── scripts/
    └── skill-three/
        └── SKILL.md
```

Each skill is independently installable:

```bash
npx skills add owner/repo --skill skill-one --skill skill-two
```

### README Template

```markdown
# <repo-name>

Agent skills for <purpose>.

## Skills

| Skill | Description | Install |
|-------|-------------|---------|
| skill-one | Does X | `npx skills add owner/repo --skill skill-one` |
| skill-two | Does Y | `npx skills add owner/repo --skill skill-two` |

## Install All

\```bash
npx skills add owner/repo --skill skill-one --skill skill-two
\```
```
