export interface RuleDoc {
  summary: string;
  why: string;
  fix: string;
}

export const RULE_DOCS: Record<string, RuleDoc> = {
  CODSY001: {
    summary: "A skill's frontmatter is invalid, or its name does not match its folder.",
    why: 'Tools and agents load a skill by its folder name; a mismatched or broken name silently breaks that lookup.',
    fix: 'Fix the YAML frontmatter, and make sure name matches the folder the SKILL.md file lives in.',
  },
  CODSY002: {
    summary: 'A skill description is missing, too short, or does not say when to use the skill.',
    why: 'An agent decides whether to use a skill from its description alone, before reading the rest of it. A weak description means the skill never gets picked when it should.',
    fix: 'Write one or two sentences stating what the skill decides and when an agent should use it.',
  },
  CODSY010: {
    summary: 'A skill is missing one of its required sections.',
    why: 'Each required section (Purpose, When to use, Input, Decision logic, Exceptions, Output, Examples) answers a question a reader or agent needs answered before trusting the skill.',
    fix: 'Add the missing section with real content.',
  },
  CODSY011: {
    summary: 'A skill has fewer than the required number of worked examples.',
    why: 'Worked examples are the fastest way to check that the decision logic actually matches real cases, for both a human reviewer and an agent.',
    fix: 'Add numbered real-world examples showing a concrete input and the resulting decision.',
  },
  CODSY012: {
    summary: "A skill's Exceptions section is empty.",
    why: 'An empty Exceptions section usually means exceptions were never thought through, not that none exist.',
    fix: "List the cases where the normal decision logic does not apply, or write 'None known.' if there truly are none.",
  },
  CODSY050: {
    summary: 'A skill has no owner, or its review is overdue.',
    why: 'Operational knowledge goes stale. Without an owner and a review cadence, nobody notices when a rule stops matching reality.',
    fix: 'Add metadata.owner, and review the skill to update metadata.last_reviewed.',
  },
  CODSY070: {
    summary: 'A skill has no evals, or fewer than the required number of cases.',
    why: 'Lint only checks that a skill is well-formed; evals are the only thing that checks it actually decides correctly.',
    fix: 'Add more cases to the matching evals/<skill>/cases.yaml file.',
  },
  CODSY020: {
    summary: "A skill's body is longer than the configured line limit.",
    why: 'A long SKILL.md is expensive for both a human and an agent to read in full, and usually mixes decision logic with background detail that belongs elsewhere.',
    fix: 'Move background detail into a references/ file and keep SKILL.md focused on the decision.',
  },
  CODSY021: {
    summary: 'Two skills have highly similar descriptions.',
    why: 'If an agent cannot tell two skills apart from their descriptions, it will pick the wrong one at least some of the time.',
    fix: 'Make each description specific about what makes that skill different from the other.',
  },
  CODSY030: {
    summary:
      'A sentence in Decision logic or Exceptions uses a vague term with no concrete reference.',
    why: 'A vague rule like "when appropriate" cannot be followed consistently by a human or an agent; it just moves the real decision to whoever reads it.',
    fix: 'Replace it with a concrete rule, e.g. "at-risk accounts go to senior support within 2 hours".',
  },
  CODSY100: {
    summary: 'A schema file does not validate against the JSON Schema 2020-12 meta-schema.',
    why: 'An invalid schema cannot reliably validate anything else, including eval inputs.',
    fix: 'Fix the schema so it validates against the JSON Schema 2020-12 meta-schema.',
  },
  CODSY101: {
    summary: 'A schema property has no description.',
    why: 'A property with no description leaves both humans and agents guessing at what the field actually means.',
    fix: 'Add a "description" field explaining what the property means.',
  },
  CODSY102: {
    summary: 'A schema requires more fields than the configured limit.',
    why: 'A schema with many required fields is hard to satisfy correctly and often signals it is covering more than one real-world concept.',
    fix: 'Split the schema, or make some of the required fields optional.',
  },
  CODSY103: {
    summary: 'A schema enum has no description explaining what its values mean.',
    why: "Enum values are often short codes; without an explanation, their meaning is only in the schema author's head.",
    fix: 'Add a "description" that explains each allowed value.',
  },
  CODSY104: {
    summary: 'A skill references a schema that does not exist.',
    why: 'A skill that points at a missing schema cannot be validated and will fail at the moment it matters.',
    fix: "Create the missing schemas/<name>.schema.json file, or fix the schema name in the skill's frontmatter.",
  },
  CODSY105: {
    summary: "An eval case's input does not match the schema it is supposed to follow.",
    why: 'An eval case with invalid input is not actually testing the skill against realistic data.',
    fix: 'Fix the input in the eval case, or update the schema to match reality.',
  },
  CODSY060: {
    summary: 'A file appears to contain a secret, such as an API key or credential.',
    why: 'Secrets committed to version control stay there even after they are removed from the current file, and can be found by anyone with repo access.',
    fix: 'Remove the secret from version control and rotate it immediately.',
  },
  CODSY061: {
    summary: 'A file contains text shaped like a prompt-injection attempt.',
    why: 'Context and skill files are read by AI agents; text written as an instruction to an agent can hijack its behavior.',
    fix: 'Remove or rephrase the text so it describes the business rather than instructing an agent.',
  },
  CODSY062: {
    summary: 'A skill folder contains an executable script that is not on the allowlist.',
    why: 'An unreviewed script inside a skill folder can run arbitrary code wherever that skill is used.',
    fix: 'Add the script to allowedScripts in codsy.config.yaml once reviewed, or remove it.',
  },
  CODSY080: {
    summary: 'A file appears to contain real personal data, such as an email or phone number.',
    why: 'Operational knowledge files are versioned and often public; real personal data does not belong there.',
    fix: 'Replace real personal data with fictional sample data, or redact it.',
  },
};
