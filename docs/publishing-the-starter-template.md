# Publishing the starter template repository

The README points "I run the business" readers at a separate, plain GitHub
repository they can open and edit without a terminal — `faelreis/codsy-starter`. That
repository is just one of the `templates/` directories from this repo, published
on its own so GitHub's web editor and PR flow work on it directly.

## One-time setup

1. Create an empty repository at `github.com/faelreis/codsy-starter`, public, with no
   README, license, or `.gitignore` (those come from the template).
2. Pick which template to publish as the default starting point — `sales` is a
   reasonable choice, since it's the most fleshed-out example.
3. Copy that template's contents to the root of the new repository:

   ```bash
   git clone https://github.com/faelreis/codsy-starter.git
   cp -r codsy/templates/sales/. codsy-starter/
   cd codsy-starter
   git add .
   git commit -m "feat: initial starter template"
   git push
   ```

4. In the new repository's settings, enable GitHub's web editor (it's on by
   default) and branch protection on `main` requiring the Codsy check from
   `.github/workflows/codsy.yml` (already included in the template) to pass
   before merging.

## Keeping it in sync

The starter repository is a snapshot, not a live mirror. When `templates/sales/`
changes in this repo in a way that should reach the starter repository too — a
schema fix, an updated eval case, a workflow change — repeat step 3's copy and
commit it to `codsy-starter` as its own pull request, so its history stays
readable on its own.

## Publishing more than one template

If sales, support, and finance should each have their own public starter
repository, repeat the steps above for `codsy-support-starter` and
`codsy-finance-starter`, copying from `templates/support/` and
`templates/finance/` respectively.
