# Agent instructions

This project's operational knowledge lives in `schemas/`, `skills/`, `context/`, and
`evals/`. Read `context/company.md` first for background, then the relevant files under
`skills/` for the specific decision you are making. Each skill's `SKILL.md` states its
input, decision logic, exceptions, and expected output.

The `collections-classification` skill only classifies accounts and drafts outreach
text. It never initiates, approves, or executes a payment.

All sample data in this template (company names, accounts, numbers) is fictional.
Replace it with your own before using this project for real decisions.

Run `codsy check` before opening a pull request that changes any of these files.
