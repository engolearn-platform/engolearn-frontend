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