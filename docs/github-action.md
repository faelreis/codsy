# Codsy GitHub Action

The `faelreis/codsy/action@v1` composite action runs `codsy check` on a pull request,
uploads the results as a SARIF file so they show up as code-scanning annotations, and
posts one summary comment on the pull request, updating that same comment on every
re-run instead of adding a new one each time.

## How it fits into a pull request

1. A pull request is opened or updated.
2. The `check` job runs the action, which:
   - Installs `codsy` and runs `codsy check` against the repository.
   - Uploads a SARIF report of the findings, visible under the pull request's
     "Checks" tab and, if code scanning is enabled for the repository, as inline
     annotations on the diff.
   - Posts (or edits) a single pull request comment with the full plain-text report:
     files, rule ids, messages, fix hints, and the summary line.
   - Fails the job if `codsy check` found any errors.
3. If an `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` repository secret is configured, a
   second `eval` job runs `codsy eval` after `check` succeeds, using that secret to
   call the configured provider.

## Using it in your own workflow

```yaml
name: Codsy

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write
  security-events: write

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: faelreis/codsy/action@v1
        with:
          strict: true
```

This is exactly what `codsy init` generates for every template.

## Versions

`@v1` always points at the latest stable `1.x` release and moves forward on each
release. To stay on one exact release, use its full tag instead, for example
`faelreis/codsy/action@v1.2.0`, or a commit SHA.

## Inputs

| Input               | Default | Description                                                                |
| ------------------- | ------- | -------------------------------------------------------------------------- |
| `strict`            | `false` | Passes `--strict` to `codsy check`, failing on warnings as well as errors. |
| `comment`           | `true`  | Posts or updates the single summary comment on the pull request.           |
| `working-directory` | `.`     | Directory containing `codsy.config.yaml`, if not the repository root.      |

## Outputs

| Output       | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| `conclusion` | `"success"` if `codsy check` passed, `"failure"` otherwise. |

## Permissions

The action needs:

- `contents: read` — to check out the repository and read the knowledge files.
- `pull-requests: write` — to post or update the summary comment. Only needed when
  `comment` is `true`.
- `security-events: write` — to upload the SARIF report for code scanning.

If a workflow only wants the pass/fail signal and doesn't need the comment or the
SARIF upload, set `comment: false` and drop `security-events: write`; the SARIF
upload step will then fail quietly without that permission, so remove it from the
workflow entirely in that case rather than relying on the permission failure.

## Optional eval job

`codsy eval` calls a real model provider and costs money per run, so it only runs
when a provider secret is present. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` as a
repository or organization secret to turn it on; leave both unset to keep pull
requests limited to the free `check` job.
