# CODSY010 — Missing required section

**Default severity**: error · **Evidence**: strong

## What it checks

That every skill has all of its required sections: Purpose, When to use, Input,
Decision logic, Exceptions, Output, Examples (configurable via
`requiredSections` in `codsy.config.yaml`).

## Why it matters

Each required section answers a question a reader or an agent needs answered
before trusting the skill. A skill missing "Exceptions" might simply have none
documented, or might have exceptions nobody ever wrote down — there's no way to
tell without the section existing.

## How to fix

Add the missing section, with real content, under a `## <Section name>` heading
that matches exactly.
