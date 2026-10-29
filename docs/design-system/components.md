# Component Specifications

## Learning surfaces

Navigation reference correction: all category/subgroup count badges use learning-mint (#DDF5F4) with primary (#006565), including zero. The actual learning category uses learning-nav-active (#F5FEFE) and learning-nav-border (#C4DFDF); completed categories stay neutral. Selected leaf rows use solid primary/white with a “Đang xem” pill and retain their completion icon. Header resume is always present during an active learning attempt, subtle at its frontier and mint-highlighted elsewhere. Review has no invented learning frontier/resume. The duplicate sidebar overall-progress summary is removed; the page header retains it.

Lesson/review cards use `learning-outline` with white primary cards, neutral nested examples, `learning-mint`/`learning-mint-border` for viewed rows, learner/customer dialogue and positive feedback, and `learning-note`/`learning-note-ink` for existing tips and word-class badges. Tokens are declared centrally in tokens.yaml/App.css; the global header/palette stays unchanged. Speaker labels remain the API names; unknown roles use neutral styling. Keep English stronger than translations, meaningful 16–20px icons and 48px actions. Selected/completed/current/locked states retain text/icons as well as color.

## Button

### Primary

- Background: primary
- Text: on-primary
- Radius: md / 12px
- Font: label-lg
- Font weight: 600

### Secondary

- Background: transparent
- Border: 1px
- Text: on-surface
- Radius: md

### Icon Button

- Minimum touch target: 48x48px
- Icon: line style
- Stroke: 2px

---

## Learning Card

- Radius: lg / 16px
- Border: 1px outline-variant
- Internal padding: 20px
- Background: surface-container-lowest

Use for:

- vocabulary
- grammar
- exercise prompts
