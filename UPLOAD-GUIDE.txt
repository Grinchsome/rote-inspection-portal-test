ROTE Mobile Inspector v1.2.34
Prepared 16 September 2026

UPLOAD TO YOUR EXISTING GITHUB PAGES REPOSITORY

1. Export any current inspection as JSON and keep that copy before updating.
2. Extract the ZIP on your computer.
3. Upload the files INSIDE the extracted folder to the same repository folder
   that currently contains index.html. Replace the matching files. Do not
   upload the ZIP itself or put everything in an extra nested folder.
4. Include .nojekyll (the empty file whose name begins with a dot). Keep it
   in place if GitHub already has it.
5. After GitHub Pages has updated, open the Inspector while online. Close and
   reopen the installed app if needed. The top should show v1.2.34.
6. Import a saved JSON and check it before your next visit. Open the updated
   app online once before relying on it offline.

WHAT CHANGED

- Full customer, site and space remain separate editable fields.
- Inspection commencement date uses a date picker.
- Next examination is calculated as 12 calendar months later (29 February
  becomes 28 February in the following non-leap year).
- Shared previous inspection date, with optional per-asset date override.
- Dedicated Manufacturer & Model, separate from configuration notes.
- Inspector company defaults to Stage Electrics; optional overall comments.
- JSON export highlights missing report details, unticked assets and missing
  findings. Export draft JSON remains available for unfinished work.
- Existing search, uninspected filter, colour badges, Inspected ticks and
  photo reminders retained. Editing preserves previous data and reminders.
- New fields appear in JSON and in copy/print/Word output.

EXISTING FILES

Older JSON files remain usable. Information absent from an old file stays
blank. Old type notes are NOT automatically moved into Manufacturer & Model:
review them and move the manufacturer text when appropriate. A shortened name
already present in an old JSON must still be corrected manually.

The Inspected tick means you have dealt with the asset and recorded the
outcome, including a note if it was not found. It does not by itself mean
the asset was physically examined or passed.

When importing an old report to start a NEW visit, check dates and Inspected
ticks: this release preserves the values in the file to support resuming a
completed/in-progress inspection. The PDF reader update is a separate step.

Page 5 Failure/Advisory Details has not been added to the mobile app.
Report numbers, signatures, photos and approval remain in SafetyCulture.

VALIDATION

Tested legacy Rambert JSON import (24 assets), date formats and leap years,
new metadata and previous-date overrides through JSON round trip, copy output,
export reminders, and browser asset entry/editing with the Inspected tick.
GitHub deployment and Android installation have not been tested on your phone.
No inspection/customer data is bundled in these website files.
