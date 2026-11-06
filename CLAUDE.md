# Rules for this repository

This is a **public** repository. Everything committed here, including history, is visible to anyone.

## Hard rule: no employer-specific content

Nothing tied to the owner's employer may be committed. That includes:

- The employer's name, its programs, or internal program names
- Colleagues, stakeholders, or committee names
- Internal metrics, thresholds, escalation paths, vendor contract or BAA status
- Build details from the employer's EHR or analytics environment (record IDs, workspace names, table names)
- Any patient data, real or de-identified

Examples must be synthetic and generic ("a 400-bed academic medical center", "a sepsis early-warning alert").
Frameworks published here are written fresh as the owner's own work, not copied from internal documents.

If a request would put any of the above into this repo, stop and ask the owner instead.

## Before every commit or push

Run the content guard and do not push if it fails:

```bash
scripts/content-guard.sh
```

The guard checks the generic patterns in `.github/content-guard/patterns.txt`. Private terms (names, internal
program names) are never stored in the repo. They live in `~/.config/content-guard/extra.txt` locally and in
the `CONTENT_GUARD_EXTRA` Actions secret for CI.

A line that legitimately needs a blocked term (for example, a degree-granting university in a bio) can carry
the marker `guard:allow` on the same line, such as an HTML comment `<!-- guard:allow -->`. Use it sparingly,
and only with the owner's approval.

## Repository layout

- `README.md`: hub index linking to separate project repos
- `docs/`: GitHub Pages portfolio site
- `scripts/` and `.githooks/`: content guard and the pre-push hook
