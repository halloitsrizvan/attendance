# Attendance home design QA

Reference: user-supplied mobile attendance mockup, with a separate calendar illustration.

Implemented: lavender heading banner, five-column period selector, three-column pastel class grid, mobile header/menu and fixed four-item bottom navigation. Uses real class data and the existing attendance selection logic. Other attendance/edit screens retain their existing layout.

Validation: changed JSX compiled with the project's Next.js SWC compiler; localhost returned HTTP 200 for the home page, home JavaScript bundle and calendar image. Menu links reviewed against the existing teacher header. No production data was changed.

Visual verification is blocked: the in-app browser is unavailable and browser inventory is empty. No rendered screenshot comparison or interactive browser test was possible. Compilation and HTTP checks do not establish visual fidelity.

Artwork: currently uses a generated calendar approximation optimized to a 360px PNG. The separate user-supplied illustration is visible in the conversation but has no accessible local file path; it has not been copied byte-for-byte. Replace public/attendance-calendar.png with the original supplied asset for exact artwork.

Remaining verification: compare at the reference mobile viewport, verify menu/period/session/date/class interactions, and inspect 320px and desktop layouts. No claim of a passed visual review.

## Shared website theme

Extended the reference palette to teacher and student routes through a scoped theme wrapper, with lavender banners, warm neutral surfaces, purple accents, charcoal actions, pastel student metrics and shared mobile navigation. Existing attendance/leave status colours retain their meaning. Teacher pages reuse the grouped menu; student pages retain their own navigation destinations. Leave form submit bars sit above the dock.

Admin exclusions are centralized in lib/uiTheme.mjs. The wrapper and teacher dock are omitted for management, reporting, settings, documentation/admin tools and student controls. No data or permission rules were changed.

Validation: JSX compilation and CSS parsing passed. Four automated route-boundary tests passed. HTTP 200 confirmed for home, attendance, leave dashboard, student dashboard, student leave and settings. Browser inventory was checked again and remains empty, so mobile screenshot comparison and interactive visual QA remain blocked.

final result: blocked
