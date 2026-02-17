# Admin Interface Features

## Current admin capabilities

- Access control
  - Admin-only access guard for all admin routes.
- Users
  - Paginated user list.
  - Search by query.
  - Filters for `activated`, `contributor`, and `admin`.
  - User detail page with toggles for activation and contributor role.
  - User deletion.
- Languages
  - Language list.
  - Search by language name.
  - Create and edit language entries.
  - Editable fields: `name`, `short`, `flag`, `flag_file`, `speaker`, `rtl`.
- Courses
  - Course list with language references and metadata.
  - Search by source/learning language.
  - Create and edit course entries.
  - Editable fields: `name`, `short`, `from_language`, `learning_language`, `public`, `conlang`, `tags`, `about`.
- Stories
  - Story lookup by story id.
  - Story detail page.
  - Toggle published state.
  - Remove approvals.
  - Jump to editor/course links.

## Admin2 goals (tailwind/shadcn-first)

- Keep functional parity for core admin workflows.
- Use Tailwind utility classes as first-class styling layer.
- Use shadcn-style primitives for modals/dialog flows.
- Keep the new UI isolated under `/admin2` for safe iteration.
- Keep existing `/admin` routes untouched for fallback.
