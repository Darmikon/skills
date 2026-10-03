# Shortcuts: pin and unpin

Shared by `scan`, `fix` and `ask`. `<family>` is the skill that was called (`scan`, `fix`, `ask`).

`/<family> pin <command>` makes a separate command for one the user runs often: `/scan-<command>` and `/fix-<command>` for those families, and `/<command>` without a prefix for `ask` (`how to` becomes `/how-to`). `/<family> unpin <command>` removes it. These are the only times these skills write outside the temp directory.

**pin:**

1. Check that `<command>` is one of the family's commands. If not, say so and list them.
2. The shortcut goes in the same skills folder as the family's skill: the skill's base directory with its last name cut off as text (`/…/skills/scan` → `/…/skills`). If the target folder exists and its `SKILL.md` lacks the marker below, stop: it is someone else's skill.
3. Write `<skills folder>/<shortcut name>/SKILL.md`:

   ```markdown
   ---
   name: <shortcut name>
   description: 'Shortcut for /<family> <command>: <one line on what the command does>'
   argument-hint: '<the command's argument, e.g. [folder]>'
   disable-model-invocation: true
   ---

   <!-- <family> shortcut: made by /<family> pin, removed by /<family> unpin -->

   Read `<absolute path of the family's SKILL.md>` and follow it as if the user had typed `/<family> <command> $ARGUMENTS`.
   ```

4. Say it is made and shows in the `/` menu in a new session.

**unpin:** delete the shortcut's folder only if its `SKILL.md` has the marker. Otherwise stop and say why. Say it is gone.
