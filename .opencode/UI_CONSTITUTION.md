# UI Constitution — EngoLearn

Source of truth: `docs/design-system/tokens.yaml`, `principles.md`, `components.md`, `patterns.md`.
If this file conflicts with `docs/design-system/*`, `docs/` wins.

## 1. General principles

- Reuse existing components. Do not create duplicate UI primitives.
- Do not introduce arbitrary styling (colors, fonts, sizes, spacing, radius, shadows).
- Follow feature-based architecture.
- Brand: professional English-learning app for Vietnamese learners. Visual direction is Modern Minimalism.
- Avoid: childish gamification, excessive gradients, excessive shadows, decorative UI without functional purpose.
- Prioritize: clarity, readability, whitespace, professional appearance, learning focus.

## 2. Colors

Use tokens from `tokens.yaml` only:

- surface `#f7f9fb`, surface-dim `#d8dadc`, surface-bright `#f7f9fb`
- primary `#006565`, primary-container `#008080`, on-primary `#ffffff`
- secondary `#705d00`, secondary-container `#fcd400`
- tertiary `#4d5a74`, error `#ba1a1a`

## 3. Typography

- Font: Hanken Grotesk only (not Inter).
- headline-lg: 28px / 700 / line-height 36px.
- headline-md: 22px / 600 / line-height 28px.
- body-md: 16px / 400 / line-height 24px. Body text is normally 16px.
- Vietnamese diacritics must have sufficient line height — never compress line-height.
- When English and Vietnamese appear together, English gets stronger visual hierarchy.

## 4. Spacing, radius, layout base

- Spacing scale only: margin-page `1.25rem` (20px), gutter-card `1rem`, stack-sm `0.5rem`, stack-md `1rem`, stack-lg `1.5rem`.
- Mobile-first fluid layout. Default horizontal page margin: 20px.
- Radius scale only: sm `0.25rem`, DEFAULT `0.5rem`, md `0.75rem` (12px), lg `1rem` (16px), xl `1.5rem`, full `9999px`.
- Avoid arbitrary values such as `p-[13px]` or `gap-[17px]`.

## 5. Layout patterns

Follow `docs/design-system/patterns.md`:

- Admin Page: `Page > PageHeader (Title, Description, Actions) + PageContent`.
- List Page: `PageHeader + FilterBar + ContentCard > DataTable`.
- Form: `Form > FormSection (SectionHeader + Fields) + FormActions`.
- Wizard: `WizardHeader + StepIndicator + StepContent + WizardActions`.

## 6. Components

Always reuse: Button, Input, Select, Dialog, Card, Table, FormField. Do not recreate them.

- Button Primary: background `primary`, text `on-primary`, radius `md`/12px, weight 600.
- Button Secondary: transparent background, 1px border, radius `md`.
- Icon Button: minimum touch target 48x48px, line-style icon, 2px stroke.
- Learning Card (for vocabulary, grammar, exercise prompts): radius `lg`/16px, 1px `outline-variant` border, internal padding 20px, background `surface-container-lowest`.

## 7. Forms

Use:

```text
Form
 └── FormSection
      ├── SectionHeader
      └── Fields
 └── FormActions
```

Reuse existing Form components. Do not create custom input/label implementations when one exists.

## 8. File placement

Actual repo shape (there is no `pages/` or `api/` folder):

- Feature-specific components: `src/features/<feature>/components/`
- Page-level components: `src/features/<feature>/views/`
- Routes: `src/features/<feature>/routes.ts`
- Hooks: `src/features/<feature>/hooks/`
- Types: `src/features/<feature>/types/`

Never put feature-specific components in global UI dirs (`src/core/components/`, `src/shared/components/`).
