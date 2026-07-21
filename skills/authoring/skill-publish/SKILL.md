---
name: skill-publish
description: Create and publish agent skills to GitHub repositories. Use when the user wants to create a new skill, publish a skill to GitHub, add a skill to an existing skills repo, set up a new multi-skill repository, or says "create skill", "publish skill", "new skill", "add skill to repo". Also use when the user asks how to structure a skill, where to put a skill, or wants to package a skill for distribution via skills.sh / npx skills add.
---

# Skill Publish

Creates agent skills following Anthropic best practices and publishes them to GitHub repositories for distribution via `npx skills add`.

For the full skill writing guide, see [Skill Writing Guide](references/skill-writing-guide.md).

---

## Step 1: Determine the Target Repository

Ask the user which GitHub repository should host the skill:

> Which repository should this skill go in? (e.g., `Darmikon/my-skills`)

**If the user names a specific repo** — check if it exists:

```bash
gh repo view <owner>/<repo> --json name 2>/dev/null
```

**If the repo exists** — clone it and proceed to Step 2.

**If the repo does not exist** — confirm with the user, then create it:

> Repository `<owner>/<repo>` doesn't exist. Create it as a public skills repo?

```bash
gh repo create <owner>/<repo> --public --description "Agent skills for <purpose>" --clone
```

Then initialize the multi-skill repo structure:

```
<repo>/
├── README.md
└── skills/
    └── (skills go here)
```

Write a `README.md`:

```markdown
# <repo-name>

Agent skills for [description]. Install with:

\```bash
npx skills add <owner>/<repo> --skill <skill-name>
\```
```

**If the user doesn't know or says "new repo"** — suggest a name based on the skill purpose and confirm.

---

## Step 2: Determine the Skill Name and Purpose

If not already clear from conversation, ask:

1. **What should this skill do?** — what capability does it give the agent?
2. **When should it trigger?** — what user phrases or contexts activate it?
3. **What's the expected output?** — files, config, code, actions?

The skill name must be:
- Lowercase, hyphens only (`a-z`, `0-9`, `-`)
- 2–64 characters
- Start with a letter, no leading/trailing/consecutive hyphens
- Descriptive: `lpm-config`, `graphql-gateway`, `playwright-e2e`

---

## Step 3: Write the Skill

Read the [Skill Writing Guide](references/skill-writing-guide.md) for the full reference.

### Directory Structure

Create the skill inside the repo's `skills/` directory:

```
skills/<skill-name>/
├── SKILL.md                  # Required: frontmatter + instructions
├── references/               # Optional: detailed docs loaded on demand
│   └── <topic>.md
├── scripts/                  # Optional: executable code
│   └── <script>.py
└── assets/                   # Optional: templates, data files
    └── <file>
```

### Write SKILL.md

**Frontmatter** — only `name` and `description` are required:

```yaml
---
name: <skill-name>
description: <What the skill does + when to trigger it. Be specific and "pushy" — include trigger phrases, related concepts, and edge cases. This is the PRIMARY mechanism that determines whether the agent uses the skill.>
---
```

**Description writing rules:**
- Include BOTH what the skill does AND when to use it
- List explicit trigger phrases the user might say
- Be "pushy" — err on the side of over-triggering rather than under-triggering
- Cover adjacent use cases and synonyms
- Keep under 1024 characters

**Body** — write clear markdown instructions:
- Explain the why, not just the what — agents are smart and respond to reasoning
- Use imperative form ("Read the config", not "You should read the config")
- Include examples with realistic input/output
- Keep SKILL.md under 500 lines total
- Move detailed reference material to `references/` directory
- Reference files clearly: `See [Reference](references/topic.md)`

### Progressive Disclosure

Skills use a 3-level loading system:
1. **Metadata** (~100 tokens): `name` + `description` — always in agent context
2. **SKILL.md body** (< 5000 tokens): loaded when skill triggers
3. **Bundled resources** (unlimited): loaded on demand from `references/`, `scripts/`, `assets/`

If SKILL.md approaches 500 lines, split content into reference files.

---

## Step 4: Validate

Before committing, verify:

- [ ] `SKILL.md` exists with valid YAML frontmatter
- [ ] `name` field matches the directory name
- [ ] `name` is lowercase, hyphens only, 2–64 chars, starts with a letter
- [ ] `description` is non-empty, under 1024 chars, includes trigger phrases
- [ ] SKILL.md body is under 500 lines
- [ ] Reference files are linked correctly from SKILL.md
- [ ] No secrets, credentials, or sensitive data in any files

---

## Step 5: Commit and Push

```bash
cd <repo-path>
git add skills/<skill-name>/
git commit -m "feat: add <skill-name> skill"
git push
```

If working on a branch:
```bash
git checkout -b add-<skill-name>
git add skills/<skill-name>/
git commit -m "feat: add <skill-name> skill"
git push -u origin add-<skill-name>
```

---

## Step 6: Confirm Installation

Tell the user how to install:

```bash
npx skills add <owner>/<repo> --skill <skill-name>
```

For multiple skills from the same repo:

```bash
npx skills add <owner>/<repo> --skill skill-a --skill skill-b
```

---

## Multi-Skill Repository Structure

Repos can contain many skills. Standard layout:

```
my-skills/
├── README.md
└── skills/
    ���── skill-one/
    │   ├── SKILL.md
    │   └─�� references/
    ├── skill-two/
    │   ├── SKILL.md
    │   └── scripts/
    └── skill-three/
        └── SKILL.md
```

Each skill is independently installable via `--skill <name>`.

---

## Adding a Skill to an Existing Repo

If the repo already has skills:

1. Clone or pull the latest:
   ```bash
   gh repo clone <owner>/<repo>
   ```
2. Create `skills/<new-skill-name>/SKILL.md`
3. Commit and push
4. Update the repo's README to list the new skill

---

## Examples

**Create a skill in a new repo:**
```
User: Create a skill for managing Docker Compose configs
Agent: Which repository should this skill go in?
User: Darmikon/devtools-skills
Agent: Darmikon/devtools-skills doesn't exist. Create it as a public skills repo?
User: Yes
Agent: [creates repo, writes skill, pushes]

       Created: Darmikon/devtools-skills
       Skill: skills/docker-compose-config/SKILL.md
       Install: npx skills add Darmikon/devtools-skills --skill docker-compose-config
```

**Add a skill to an existing repo:**
```
User: Add a skill for Prisma migrations to my playon-hq-skills repo
Agent: [clones Darmikon/playon-hq-skills, creates skills/prisma-migrations/SKILL.md, pushes]

       Added: skills/prisma-migrations/SKILL.md
       Install: npx skills add Darmikon/playon-hq-skills --skill prisma-migrations
```
