---
name: frontend-ui
description: >
  Use when creating or modifying frontend UI.
  Ensures consistency with EngoLearn's design system,
  component architecture, layout patterns and visual language.
---

# EngoLearn Frontend UI Skill

When working on frontend UI, follow the EngoLearn
design system.

## Before coding

Read:

1. `docs/design-system/tokens.yaml`
2. `docs/design-system/principles.md`
3. `docs/design-system/components.md`
4. `docs/design-system/patterns.md`

Also inspect existing components before creating new ones.

## Component reuse

Always search for an existing component before creating
a new UI primitive.

Prefer:

- existing Button
- existing Input
- existing Card
- existing Dialog
- existing Form components
- existing layout components

Do not duplicate existing components.

## Styling

Use design tokens.

Do not introduce arbitrary:

- colors
- font families
- font sizes
- spacing
- border radius
- shadows

## Layout

Follow the patterns defined in:

`docs/design-system/patterns.md`

## File placement

Follow the project's frontend architecture.

Feature-specific components belong inside their feature.

Do not create feature-specific components inside
global UI directories.

## Validation

Before finishing:

- verify typography
- verify spacing
- verify colors
- verify responsive behavior
- verify component reuse
- verify file placement