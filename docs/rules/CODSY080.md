# CODSY080 — Personal data

**Default severity**: error · **Evidence**: weak

## What it checks

Every file against patterns for email addresses, US-shaped phone numbers, and US
Social Security numbers by default, plus any patterns you add to
`personalDataPatterns`. Email addresses on reserved sample domains
(`example.com`, `example.org`, `example.net`, `example.edu`, `test.com`) are
exempt, since templates and fixtures use them deliberately for fictional data.

## Why it matters

Operational knowledge files are versioned and often shared broadly inside, or even
outside, a company. Real personal data doesn't belong there any more than it
belongs in a public bug tracker.

## Why this is weak evidence

Only US phone numbers and US Social Security numbers are covered out of the box;
other countries' national ID and phone formats need to be added via
`personalDataPatterns`. Pattern matching can also flag a fictional or placeholder
value that merely looks like real personal data, and can miss formats it wasn't
written to recognize.

## How to fix

Replace the real personal data with fictional sample data, or redact it entirely.
If it's already fictional and just needs to stop matching, change it to a value
that doesn't look like a real address, phone number, or ID.
