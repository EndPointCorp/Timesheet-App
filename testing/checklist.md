# Timesheet App: Manual Test Checklist

Someone (an AI or a person) drives the browser, works top to bottom, and records a
Result for every test. Two rules keep the results honest: each expected outcome is
something you can see, and each result has evidence.

## Rules

1. **Expect something you can see.** Each `Expect` must be a specific, visible fact:
   exact text, a URL, an element that is present, a count. Never "looks fine" or
   "seems correct."
2. **Pass / Fail / Unsure.** If you cannot actually verify the `Expect`, mark
   **Unsure**, not Pass. Do not guess Pass.
3. **Evidence is mandatory.** Every result records what you actually saw (`Saw:`)
   and a screenshot filename. A Pass with no `Saw` value and no screenshot does not
   count as a Pass.
4. **Any server or console error fails the test.** A 500-level response or a red
   console error during a step is an automatic **Fail**, no matter how the screen
   looks. Record the error text. A silent 500 on an otherwise normal-looking page is
   exactly the kind of regression this rule catches.
5. **One run, one state.** Start logged out and fresh. Copy this file to
   `runs/<date>/results.md` and fill that copy. Leave this template clean.

## Result key

`Result: Pass | Fail | Unsure | Saw: <what you observed> | Evidence: <file.png>`

## Environment

- App URL: _<fill in per run>_
- Superuser: `admin@example.com` / `please1234`
- Demo users (non-super): `alice` through `hannah` @example.com, same password
- Seed/reset: see `backend/README.md` (`rails db:seed`)
- **Data safety:** run only against a disposable, seeded DB. Several tests create
  and delete data (users, work charts, transactions, groups). Never point this at
  production or any data you care about.
- Notes on exact numbers: where a test checks money/time totals, the best check is
  "matches a known seeded value." Until fixed seed data with known totals exists,
  use the weaker but still-checkable version: the value is there and it adds up
  (for example, the rows sum to the shown grand total). These are tagged
  **[needs-fixture]**.

## Running and reviewing

1. Bring up a disposable backend and frontend, and seed the DB. Record the app URL
   and the frontend git commit at the top of `results.md`.
2. Copy this file to `runs/<date>/results.md` and work through it logged out, in
   order, capturing a screenshot per test.
3. A human reviews every Fail and every Unsure afterward (real bug, flaky, or
   expected) and notes known-acceptable results in `runs/<date>/summary.md` so they
   are not re-checked next run. The AI's Pass marks are not final on their own. This
   review is what makes the pass trustworthy.

---

## Driving notes

Things about this app that are easy to get wrong when you drive it. Learned the
hard way during the June 2026 run. Read these before you start; they will save you
from writing down "Fail" when the app is fine and you just drove it wrong.

1. **The app uses a hash router.** Every page is `/#/something`. After login the
   app navigates to `/`, which sets the hash to `#/` but often leaves the path as
   `/login`. So "am I on the calendar" means the hash is `#/` or empty. Do not
   check the path.
2. **Do not wait for the network to go idle.** This app polls in the background
   and never goes idle, so waiting for it hangs forever.
3. **A spinner can swallow your clicks.** While a page loads, a round spinner sits
   on top of the nav bar. If a click seems to do nothing, wait for the spinner to
   go away, then click again.
4. **The Settings menu opens on hover, not on click.** A headless browser will not
   open it. Go to the URL directly instead.
5. **The chart search box needs at least 3 characters.** Fewer and it does not
   search at all. Results only show while the box has focus.
6. **Picking a leaf chart fills in its own kind.** Wait for that to happen before
   you set hours, or Save stays greyed out.
7. **Some leaf charts have no kinds.** Save stays greyed out and it is not your
   fault. Pick a different chart.
8. **A chart can only become a parent if it has no work entries.** Otherwise the
   save fails and the app shows an alert. In the seed data, "Clients" (id 2) and
   "Other" (id 3) can take children.
9. **The chart editor tabs are exclusive toggles.** General / Children / Managers /
   Transactions. Clicking the tab that is already open closes it. Start from
   General.
10. **Group and chart labels are edit-in-place text.** The Save button only appears
    after the text actually changes and you click away. Triple-click to select the
    label, type over it, then press Tab.
11. **The roles editor Save button has no accessible name.** Find it by its text.
12. **A new user's name must be lowercase letters only.** The database enforces it.
    The username comes from the part of the email before the `@`. So an email with
    digits or hyphens before the `@` makes the save fail with a server error. Use
    letters only.
13. **The calendar logs a React warning about `<img>` inside `<select>`.** It is a
    development warning, not a server error, so it does not fail a test. Rule 4 is
    about 500-level responses and real errors.

---

## 1. Auth and session

### LOGIN-01: Valid login
- Do: go to `/login`, enter `admin@example.com` / `please1234`, submit.
- Expect: lands on `/` (calendar), nav shows the logged-in email.
- Result: ___ | Saw: ___ | Evidence: ___

### LOGIN-02: Invalid password rejected  [negative]
- Do: log in with `admin@example.com` / `wrongpass`.
- Expect: stays on login, an invalid-credentials message is shown, URL is not `/`.
- Result: ___ | Saw: ___ | Evidence: ___

### LOGIN-03: Protected route while logged out  [negative]
- Do: while logged out, open `/reports` directly.
- Expect: redirected to `/login`, not the report.
- Result: ___ | Saw: ___ | Evidence: ___

### LOGOUT-01: Logout ends the session
- Do: log in, then click Logout.
- Expect: returns to `/login`. Pressing browser Back does not re-enter the app
  (still shows login or redirects there).
- Result: ___ | Saw: ___ | Evidence: ___

### AUTH-01: Non-admin blocked from admin page  [permissions]
- Do: log in as a demo user (for example `alice`), open `/users-editor` directly.
- Expect: access is refused. Shows `/unauthorized` or redirects away, and the roles
  editor does not render.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 2. Navigation integrity

### NAV-01: Top menu items land correctly
- Do: from the menu, click Calendar, Today, New Entry in turn.
- Expect: Calendar goes to `/`, Today goes to a `/entries/Y/M/D` for today, New
  Entry goes to `/entries/Y/M/D/new`. Each target page renders.
- Result: ___ | Saw: ___ | Evidence: ___

### NAV-02: Settings menu items land correctly
- Do: open Settings, click each: Roles editor, Edit work charts, Reports, Switch
  role, Create user, User calendar.
- Expect: each lands on the page its label names. Roles editor goes to
  `/users-editor`, Edit work charts to `/work_charts/editor`, Reports to `/reports`,
  Switch role to the switch-role page, Create user to `/create_user`, User calendar
  to a user calendar. Record where each one actually goes. Mark Fail if a menu item
  does not reach the page its label names.
- Result: ___ | Saw: ___ | Evidence: ___

### NAV-03: Direct-URL routes render
- Do: type these URLs directly: `/dashboard`, `/groups-editor`, `/create_group`.
- Expect: each renders its real page, not a redirect back to `/`.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 3. Calendar

### CAL-01: Month renders
- Do: open `/`.
- Expect: current month and year label shown, a grid of day cells is present.
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-02: Change month
- Do: use the calendar's next/prev controls.
- Expect: the month and year label changes accordingly, grid updates.
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-03: Appearance and color-coding
- Do: look at the calendar's color-coding and general layout, screenshot it.
- Expect: capture a screenshot for human review. Mark **Unsure** unless something
  is plainly broken (overlapping text, missing section, blank cells).
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-04: Sick / vacation section
- Do: locate the sick and vacation section.
- Expect: section is present and shows values (numbers or "0", not blank or NaN).
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-05: Bottom columns
- Do: locate the bottom columns/totals.
- Expect: present and populated (no blank, NaN, or undefined). [needs-fixture] for exact values.
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-06: Click a date
- Do: click a day cell.
- Expect: navigates to that day's entries (`/entries/Y/M/D` matching the clicked date).
- Result: ___ | Saw: ___ | Evidence: ___

### CAL-07: Month hyperlink
- Do: click the month hyperlink.
- Expect: navigates as labelled (record destination URL).
- Result: ___ | Saw: ___ | Evidence: ___

---

## 4. Day view and entries

### DAY-01: Today redirect
- Do: open `/today`.
- Expect: redirects to `/entries/Y/M/D` for today's date.
- Result: ___ | Saw: ___ | Evidence: ___

### DAY-02: Day totals
- Do: view a day with entries.
- Expect: totals panel (right side) renders with numeric values. [needs-fixture] for exact.
- Result: ___ | Saw: ___ | Evidence: ___

### DAY-03: Entries list
- Do: open a day that has seeded entries.
- Expect: each entry shows its work chart and hours, count is greater than 0.
- Result: ___ | Saw: ___ | Evidence: ___

### DAY-04: Edit button
- Do: click an entry's edit control.
- Expect: opens the edit form at `/entries/:id/edit` pre-filled with that entry.
- Result: ___ | Saw: ___ | Evidence: ___

### DAY-05: Delete button
- Do: note the entry count, delete one entry, confirm.
- Expect: that entry is gone, count drops by exactly 1.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 5. New entry

### NEW-01: Open form
- Do: open `/entries/Y/M/D/new` (or New Entry menu).
- Expect: the new-entry form renders with a work-chart selector and a time row.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-02: Select work chart by search
- Do: search and pick a work chart.
- Expect: the chosen chart is shown as selected.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-03: Select via quick pick
- Do: use a quick-pick chart.
- Expect: chart populates without manual search.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-04: Add / delete a time row
- Do: add another time row, then delete a time row.
- Expect: row count goes up by 1, then down by 1.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-05: Add description
- Do: type a description.
- Expect: text is accepted in the field.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-06: Change date
- Do: change the entry date.
- Expect: the form's date reflects the new value.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-07: Save
- Do: save the entry.
- Expect: returns to that day, the new entry appears in the list.
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-08: Cancel
- Do: open a new entry, cancel it.
- Expect: no entry is created (day count unchanged).
- Result: ___ | Saw: ___ | Evidence: ___

### NEW-09: Keyboard shortcut
- Do: press Ctrl+Alt+N from a day view.
- Expect: navigates to the new-entry form for that day.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 6. Edit entry

### EDIT-01: Edit and save
- Do: open an entry's edit form, change hours and description, save.
- Expect: list reflects the new hours and description.
- Result: ___ | Saw: ___ | Evidence: ___

### EDIT-02: Previous / next
- Do: use previous/next navigation between entries.
- Expect: moves to an adjacent entry (record which).
- Result: ___ | Saw: ___ | Evidence: ___

---

## 7. Switch role and user calendar

### SWITCH-01: Open switch role
- Do: open `/switch-role`.
- Expect: a list of other users renders.
- Result: ___ | Saw: ___ | Evidence: ___

### SWITCH-02: Switch to a user
- Do: pick a user to view as.
- Expect: app indicates you are now acting as or viewing that user.
- Result: ___ | Saw: ___ | Evidence: ___

### SWITCH-03: Switch back / stop
- Do: switch back to yourself or stop viewing.
- Expect: returns to your own context.
- Result: ___ | Saw: ___ | Evidence: ___

### UCAL-01: Another user's calendar
- Do: open `/calendar-user/<year>/<month>/<username>` for a demo user.
- Expect: that user's calendar renders for the given month.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 8. Create user

### USER-01: Open form
- Do: open `/create_user`.
- Expect: the create-user form renders with name, email, timezone, password,
  joining date, and team fields.
- Result: ___ | Saw: ___ | Evidence: ___

### USER-02 / 03: Fill and submit
- Do: enter a unique test name, email, timezone, password, joining date, team, then submit.
- Expect: success indication, the new user is findable (for example, appears in roles editor).
- Result: ___ | Saw: ___ | Evidence: ___

### USER-04: Validation  [negative]
- Do: submit with a missing required field or a duplicate email.
- Expect: a validation error is shown, no user is created.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 9. Roles editor (rights)

### ROLE-01: Open
- Do: open `/users-editor` as admin.
- Expect: a list of users and roles renders.
- Result: ___ | Saw: ___ | Evidence: ___

### ROLE-02: Inspect a user's rights
- Do: select a user.
- Expect: their current roles and rights are displayed.
- Result: ___ | Saw: ___ | Evidence: ___

### ROLE-03: Grant a right
- Do: grant a right to a user, save, reload the page.
- Expect: the right is still set after reload (persisted).
- Result: ___ | Saw: ___ | Evidence: ___

### ROLE-04: Revoke a right
- Do: revoke a right, save, reload.
- Expect: the right is gone after reload.
- Result: ___ | Saw: ___ | Evidence: ___

### ROLE-05: Right actually gates a feature
- Do: revoke a feature-gating right from a demo user, log in as that user, try the feature.
- Expect: the feature is hidden or refused for that user.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 10. Work charts editor

### WC-01: Open
- Do: open `/work_charts/editor`.
- Expect: the chart tree/list renders.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-02: Search / filter
- Do: search for a chart by name.
- Expect: the list filters to matching charts.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-03: Open a chart
- Do: open one chart.
- Expect: its details and tabs render.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-04: Create a work chart
- Do: create a new work chart.
- Expect: it appears in the tree/list after save.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-05: Add a child chart
- Do: add a child under an existing chart.
- Expect: the child appears nested under its parent.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-06: Reporting settings
- Do: change a chart's reporting settings, save, reload.
- Expect: the change persists.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-07: Duration kinds
- Do: set, then clear, the chart's duration kinds.
- Expect: the kinds set updates accordingly and persists.
- Result: ___ | Saw: ___ | Evidence: ___

### WC-08: Assign a project manager
- Do: assign a PM to a chart.
- Expect: the PM shows as assigned after save.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 11. Recurring transactions

### TXN-01: Open
- Do: open the transactions area of a work chart.
- Expect: existing transactions (if any) render.
- Result: ___ | Saw: ___ | Evidence: ___

### TXN-02: Create
- Do: create a new transaction.
- Expect: it appears in the list after save.
- Result: ___ | Saw: ___ | Evidence: ___

### TXN-03: Edit
- Do: edit a transaction's values, save.
- Expect: the list reflects the change.
- Result: ___ | Saw: ___ | Evidence: ___

### TXN-04: Delete
- Do: delete a transaction, confirm.
- Expect: it is removed, count drops by 1.
- Result: ___ | Saw: ___ | Evidence: ___

### TXN-05: Remaining-hours badge
- Do: view the calendar's remaining-hours badge for a chart with a transaction.
- Expect: the badge reflects the transaction. [needs-fixture] for exact figure.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 12. Groups

### GRP-01: Open groups editor
- Do: open `/groups-editor`.
- Expect: groups and teams render.
- Result: ___ | Saw: ___ | Evidence: ___

### GRP-02: Inspect a group
- Do: select a group.
- Expect: its details and members render.
- Result: ___ | Saw: ___ | Evidence: ___

### GRP-03: Create a group
- Do: open `/create_group`, fill the form, submit.
- Expect: the group is created and findable.
- Result: ___ | Saw: ___ | Evidence: ___

### GRP-04: Edit a group
- Do: edit a group, save, reload.
- Expect: the change persists.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 13. Dashboard

### DASH-01: Renders
- Do: open `/dashboard`.
- Expect: the dashboard view (day cards) renders.
- Result: ___ | Saw: ___ | Evidence: ___

---

## 14. Reports

### REP-01: Date range
- Do: set a start and end date.
- Expect: the inputs accept the range.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-02: Show dates toggle
- Do: tick/untick "show dates."
- Expect: the toggle state changes (and report respects it once generated).
- Result: ___ | Saw: ___ | Evidence: ___

### REP-03: Select user(s)
- Do: select one or more users.
- Expect: selection reflected.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-04: Select work chart
- Do: pick a work chart.
- Expect: selection reflected.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-05 / 06 / 07: Toggles
- Do: toggle full descriptions, open-in-new-window, show-hours-in-the-bank.
- Expect: each toggle changes state.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-08: Search All slider
- Do: enable "Search All" (include inactive charts).
- Expect: inactive charts become selectable.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-09: Generate report
- Do: generate the report.
- Expect: report renders with rows.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-10: PDF
- Do: enable the PDF slider and generate.
- Expect: a PDF is produced. Open it and confirm it contains the report content
  (not blank, not an error page). [needs-fixture] for exact numbers.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-11 / 12: Presets
- Do: create a preset, then use it.
- Expect: the preset saves and, when used, restores the saved settings.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-13: Report types
- Do: run each: Break, Billing at leaf, Billing, By user, Standard.
- Expect: each renders its report.
- Result: ___ | Saw: ___ | Evidence: ___

### REP-14: Totals consistency  [needs-fixture]
- Do: on a generated report, compare row values to the grand total.
- Expect: the rows sum to the shown total. (Stronger check once known-values seed
  data exists: totals equal the seeded expected figures.)
- Result: ___ | Saw: ___ | Evidence: ___

---

## 15. Cross-cutting

### XC-01: Cross-tab logout
- Do: log in in two tabs, log out in one.
- Expect: the other tab also drops to the login page.
- Result: ___ | Saw: ___ | Evidence: ___

### XC-02: Run-wide error roundup
- Do: across the whole run, watch for any 5xx response or red console error.
- Expect: none. List every one seen. This is the most important single signal that
  the backend stayed healthy through the run.
- Result: ___ | Saw: ___ | Evidence: ___
