# UI Patterns

## Admin Page

Every admin page should follow:

Page
├── PageHeader
│   ├── Title
│   ├── Description
│   └── Actions
│
└── PageContent

Example:

<Page>
  <PageHeader />
  <PageContent>
    ...
  </PageContent>
</Page>

## Form Pattern

Form
├── FormSection
│   ├── SectionHeader
│   └── Fields
│
└── FormActions

Use existing Form components.

Do not create custom input/label implementations
when an existing component can be reused.

## Wizard Pattern

Wizard
├── WizardHeader
├── StepIndicator
├── StepContent
└── WizardActions

## List Page

PageHeader
FilterBar
ContentCard
└── DataTable

### Shared management components

`ManagementPageHeader` accepts `showExport` (default `true` for existing screens).
Set it to `false` when the screen has no export operation. `CefrSelect` accepts
typed level options per feature; the default A1–B2 options remain unchanged.
Passage management supplies A1–C2 and follows the Topic list composition with
global status counters, filters, a six-column table and shared pagination.
See [Passage management](../features/learning-path/management/passages.md).
