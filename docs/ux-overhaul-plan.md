# UX overhaul: plan and acceptance criteria

This document tracks the remediation derived from the desktop and mobile opening/closing-flow audit.

## Delivery order

1. **Urgent desktop foundations — complete**
   - Shared layer stack for dialogs, panels, the tour, reporting and Community.
   - Top-layer-only Escape behavior.
   - Focus entry, focus trap, focus restoration, inert background and scroll-lock cleanup.
   - Keyboard-operable search results.

2. **Mobile sheet architecture — complete**
   - Filters, Timeline, Analysis, Case and More use the shared layer stack.
   - Every sheet has an explicit close action.
   - Backdrop, Escape, focus and bottom-navigation state stay synchronized.
   - Closing a sheet no longer silently deletes the selected-case context.

3. **Tour and context continuity — complete**
   - The mobile tour no longer opens a competing case sheet.
   - Desktop tour and case detail close as one coordinated journey.
   - Internal scroll and selected-case state survive non-destructive transitions.

4. **Navigation and form safety — complete**
   - Browser Back closes the topmost UI layer before leaving the atlas.
   - Report and Research Pass forms warn before discarding entered data.
   - Report mode has an explicit, persistent cancel action.

5. **Accessibility and interaction polish — complete**
   - Dialog, tab, slider, combobox and live-region semantics.
   - Keyboard-operable filter headings, chips, timeline events and search.
   - Consistent close labels, tooltips, focus-visible treatment and 44px mobile targets.
   - Reduced-motion support and consistent backdrop tokens.
   - Blocking modals visually cover and deactivate the mobile navigation.

6. **Regression coverage — complete**
   - Desktop, tablet, portrait-mobile and landscape-mobile Chromium projects.
   - Layer focus/close/scroll contracts.
   - Keyboard search and filter interaction.
   - Mobile sheets, browser history, tour, report mode and dirty-form protection.
   - Light-theme persistence and layered-UI legibility.
   - Safe PC-to-mobile-to-PC breakpoint transitions without stranded focus or backdrops.
   - Compact, accessible tablet actions and the mobile interaction model on short landscape screens.

## Acceptance command

```bash
npm run test:ux
```

## Local UX telemetry

The application dispatches `ufologist:ux` browser events for layer opens/closes, search-result opens, report-mode progress and tour progress. If a host provides `window.dataLayer`, the same events are mirrored there. No analytics endpoint or third-party transmission is added by this overhaul.

## Manual device follow-up

Chromium emulation covers the regression contract. Before a public release, repeat the primary flows with VoiceOver on Safari/iOS and TalkBack on Chrome/Android to validate platform-specific announcement order and virtual-keyboard behavior.
