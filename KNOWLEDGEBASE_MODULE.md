# Knowledge Base Module

## Overview

The Knowledge Base module is a comprehensive help and documentation system for the IT Asset Manager application. It allows administrators and managers to create, manage, and publish articles to help users understand various aspects of IT management, troubleshooting, and procedures.

## Features

### 1. Article Management

- **Create Articles**: Admins and managers can create new knowledge base articles
- **Edit Articles**: Authors and admins can edit existing articles
- **Delete Articles**: Authors and admins can delete articles
- **Draft/Publish**: Articles can be saved as drafts or published immediately
- **Archive**: Old articles can be archived

### 2. Article Organization

- **Categories**: 8 predefined categories:
  - Hardware
  - Software
  - Network
  - Security
  - Procedures
  - Troubleshooting
  - FAQ
  - General
- **Tags**: Flexible tagging system for cross-referencing
- **Search**: Full-text search across title, content, and tags

### 3. User Engagement

- **View Counter**: Tracks how many times an article is viewed
- **Helpful Voting**: Users can mark articles as helpful or not helpful
- **Related Articles**: Automatically suggests related articles based on category and tags

### 4. Access Control

- **Admin**: Full access (create, read, update, delete all articles)
- **Manager**: Can create and edit articles
- **Employee**: Read-only access to published articles

## File Structure

```
lib/
├── models/
│   └── Knowledge.ts              # Data model and types
└── actions/
    └── knowledge.ts              # Server actions for CRUD operations

app/
├── knowledgebase/
│   ├── page.tsx                  # Main listing page
│   ├── new/
│   │   └── page.tsx              # Create new article
│   └── [id]/
│       ├── page.tsx              # View article
│       └── edit/
│           └── page.tsx          # Edit article

components/
└── knowledgebase/
    ├── knowledgebase-page-content.tsx  # Main page wrapper with search
    ├── article-list.tsx                # Responsive datatable/card display
    ├── article-search-filters.tsx      # Filter component
    ├── article-form.tsx                # Create/edit form with WYSIWYG
    ├── article-viewer.tsx              # Article detail view with voting
    └── rich-text-editor.tsx            # Tiptap WYSIWYG editor component

styles/
└── tiptap.css                          # Tiptap editor styling
```

## Database Schema

### Collection: `knowledge`

```typescript
{
  _id: ObjectId,
  title: string,
  slug: string,                    // URL-friendly version of title
  content: string,                 // Main article content (HTML from WYSIWYG editor)
  summary?: string,                // Optional brief summary (kept for backward compatibility, not shown in UI)
  category: ArticleCategory,       // One of 8 predefined categories
  tags: string[],                  // Array of tags for search/organization
  status: ArticleStatus,           // draft | published | archived
  authorId: string,                // User ID of article creator
  authorName: string,              // Display name of author
  viewCount: number,               // Number of views
  helpfulCount: number,            // Number of "helpful" votes
  notHelpfulCount: number,         // Number of "not helpful" votes
  relatedArticles?: string[],      // Optional array of related article IDs
  attachments?: [{                 // Optional file attachments (future feature)
    name: string,
    url: string,
    size: number
  }],
  createdAt: Date,
  updatedAt: Date,
  publishedAt?: Date,              // When article was first published
  lastEditedBy?: string            // Last editor's name
}
```

## API Actions

### Available Server Actions

1. **createArticle(data)** - Create a new article
2. **getArticles(filters?)** - Get all articles with optional filters
3. **getArticleById(id)** - Get a specific article by ID
4. **getArticleBySlug(slug)** - Get article by URL slug
5. **updateArticle(id, data)** - Update an existing article
6. **deleteArticle(id)** - Delete an article
7. **incrementViewCount(id)** - Increment article view count
8. **markArticleHelpful(id, helpful)** - Vote on article helpfulness
9. **getPopularArticles(limit)** - Get most viewed articles
10. **getRelatedArticles(articleId, limit)** - Get related articles
11. **getAllTags()** - Get all unique tags

## Usage Examples

### Creating a New Article

<h1>Network Password Reset</h1><p>Follow these steps...</p>", // HTML from WYSIWYG editor
  category: "procedures",
  tags: ["password", "network", "security"],
  status: "published",
  authorId: user.id,
  authorName: user.name,
});
```

**Note**: Summary field is no longer used in the UI but kept in the model for backward compatibility.tatus: "published",
authorId: user.id,
authorName: user.name,
});

````

### Searching Articles

```typescript
const result = await getArticles({
  category: "troubleshooting",
  search: "printer",
  status: "published",
});
````

### Updating Article Status

```typescript
const result = await updateArticle(articleId, {
  status: "archived",
  lastEditedBy: user.name,
});
```

## Content Formatting

Articles use a WYSIWYG editor (Tiptap) that supports:

- **Headers**: H1, H2, H3 via toolbar buttons
- **Text Formatting**: Bold, Italic, Code
- **Lists**: Bullet lists and numbered lists
- **Blockquotes**: Quote blocks
- **Paragraphs**: Regular text with proper spacing
- Content is stored as HTML in the database

## Permissions

The knowledge module integrates with the existing RBAC system:

### Admin

- Create, edit, delete all articles
- View draft, published, and archived articles
- Full access to all features

### Manager

- Create articles
- View all articles
- Edit and delete only their own articles (cannot edit/delete others' articles)

### Employee

- View published articles only
- Vote on article helpfulness
- Search and browse the knowledge base

## Implemented Features

### WYSIWYG Editor

- Tiptap rich text editor with toolbar
- Bold, Italic, Code formatting
- Headings (H1, H2, H3)
- Bullet and ordered lists
- Blockquotes
- Undo/Redo functionality
- Content stored as HTML

### Responsive Design

- **Desktop**: Datatable view with sortable columns
- **Mobile**: Card-based grid layout
- Adaptive UI for optimal viewing on all devices

### Enhanced Permissions

- **Admin**: Full CRUD access to all articles
- **Manager**: Create articles, edit/delete only own articles
- **Employee**: Read-only access to published articles
- Only article creator and admin can edit/delete articles

## Future Enhancements

Potential improvements for the knowledge base:

1. **File Attachments**: Allow uploading images and documents
2. **Version History**: Track article revisions
3. **Comments**: Allow users to comment on articles
4. **Bookmarks**: Let users save favorite articles
5. **Analytics**: Detailed viewing statistics and insights
6. **Export**: Export articles to PDF or other formats
7. **Categories Management**: Dynamic category creation
8. **Advanced Search**: Faceted search with filters
9. **Article Templates**: Predefined templates for common article types

## Integration Points

The knowledge base integrates with:

- **Authentication**: Uses existing auth system for user identification
- **RBAC**: Respects role-based permissions
- **UI Components**: Uses the shadcn/ui component library
- **Navigation**: Added to main sidebar navigation

## Testing Checklist

- [ ] Create a new article as admin
- [ ] Create a new article as manager
- [ ] Try to create article as employee (should redirect)
- [ ] Edit article as author
- [ ] Edit article as admin
- [ ] Try to edit someone else's article as manager
- [ ] Delete article as author
- [ ] Search for articles
- [ ] Filter by category
- [ ] Add and remove tags
- [ ] Vote on article helpfulness
- [ ] View related articles
- [ ] Check view counter increments
- [ ] Publish draft article
- [ ] Archive published article
- [ ] Navigate through mobile menu
