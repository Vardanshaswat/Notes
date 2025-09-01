// <CHANGE> remove stray comment line at the top
# Notes App (Next.js + MongoDB)

// ... existing code ...

// <CHANGE> close the schema code block properly
## Schema
Notes collection document:
\`\`\`
{ _id, title, content, labels: string[], color: string, pinned: boolean, archived: boolean, createdAt: Date, updatedAt: Date }
