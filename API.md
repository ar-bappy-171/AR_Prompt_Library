# Prompt Vault API Documentation

## Overview

Prompt Vault uses a localStorage-based architecture for data persistence. This document provides comprehensive details about the application's functions, data structures, and usage patterns.

## Table of Contents

1. [Data Structures](#data-structures)
2. [CRUD Operations](#crud-operations)
3. [Favorites & Templates](#favorites--templates)
4. [UI Functions](#ui-functions)
5. [Utility Functions](#utility-functions)
6. [Storage Management](#storage-management)
7. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Data Structures

### Prompt Object

```javascript
{
  id: string,              // Unique identifier (generated via generateId())
  title: string,           // Prompt title
  category: string,        // Category name (art, writing, code, analysis, creative, other)
  tags: string[],          // Array of tag strings
  text: string,            // Main prompt text
  notes: string,           // Optional additional notes
  rating: number,          // 0-5 effectiveness rating
  resultImages: string[],  // Array of base64 encoded result images (up to 3)
  inputImage: string,      // Base64 encoded input reference image (optional)
  createdAt: ISO8601,      // Creation timestamp
  updatedAt: ISO8601       // Last update timestamp
}
```

### Template Object

```javascript
{
  id: string,              // Unique identifier
  name: string,            // Template name
  category: string,        // Default category
  tags: string,            // Comma-separated tags
  text: string,            // Template prompt text
  notes: string,           // Optional notes
  createdAt: ISO8601       // Creation timestamp
}
```

### Storage Keys

- `promptVault` - JSON array of all prompts
- `promptFavorites` - JSON array of favorite prompt IDs
- `promptTemplates` - JSON array of template objects
- `promptVersions` - JSON object storing version history
- `darkMode` - Boolean indicating dark mode status

---

## CRUD Operations

### Create Prompt

```javascript
// Initialize form and show modal
addNewPrompt()

// Save new/edited prompt
savePrompt(event)
```

**Parameters:**
- `event` (Event): Form submission event

**Behavior:**
- Validates required fields (title, category, text)
- Processes images from file inputs
- Saves to localStorage
- Updates UI

### Read Prompts

```javascript
// Load and display all prompts
loadPrompts()

// Load prompts for display in modal
loadPrompts()

// Search prompts
generateSearchSuggestions(searchTerm)
```

### Update Prompt

```javascript
// Open existing prompt for editing
editPrompt(promptId)

// Save changes to existing prompt
savePrompt(event)  // When editingPromptId is set
```

### Delete Prompt

```javascript
// Delete with confirmation
deletePrompt(promptId)
```

**Behavior:**
- Shows confirmation dialog
- Removes from prompts array
- Removes from favorites if applicable
- Updates localStorage and UI

---

## Favorites & Templates

### Favorites Management

```javascript
// Toggle favorite status
toggleFavorite(promptId)

// Save favorites to localStorage
saveFavorites()

// Returns: void
// Side effects: Updates UI, shows toast notification
```

### Template Management

```javascript
// Load templates modal
loadTemplatesModal()

// Create template from current form
createTemplateFromCurrent()

// Load template into form
loadTemplateIntoForm(templateId)

// Delete template
deleteTemplate(templateId)

// Save templates to localStorage
saveTemplates()
```

---

## UI Functions

### Modals

```javascript
// Show modal by ID
showModal(modalId)

// Close all open modals
closeAllModals()

// Show confirmation dialog
showConfirmModal(title, message, confirmCallback)
```

### Notifications

```javascript
// Show toast notification
showToast(message, type)

// Types: 'success', 'error', 'warning', 'info'
```

### Form Management

```javascript
// Reset form to initial state
resetForm()

// Update character count display
updateCharCount()

// Update rating stars in form
updateRatingStars(value)

// Calculate word count from text
calculateWordCount(text)

// Estimate token count (approximate)
estimateTokenCount(text)

// Calculate prompt complexity
calculateComplexity(prompt)
```

### Search & Filter

```javascript
// Generate autocomplete suggestions
generateSearchSuggestions(searchTerm)

// Navigate suggestions with arrow keys
navigateSuggestions(direction)

// Apply search results to display
applySearchResults(results, searchTerm)
```

### Statistics

```javascript
// Update sidebar statistics
updateStatistics()

// Update detailed statistics modal
updateDetailedStatistics()

// Generate statistics visualization
updateDetailedStatistics()
```

### Theme

```javascript
// Toggle dark/light mode (automatic via click handler)
// Stored in localStorage as 'darkMode'
```

### View Modes

```javascript
// Current view mode stored in: viewMode
// Values: 'grid' or 'list'
// Changed via view-controls buttons
```

---

## Utility Functions

### ID Generation

```javascript
/**
 * Generate unique ID for prompts
 * @returns {string} Unique ID (timestamp + random)
 */
function generateId()
```

### Text Processing

```javascript
// Escape HTML special characters
escapeHtml(text)

// Get display name for category
getCategoryDisplayName(categoryKey)

// Get complexity label
getComplexityLabel(complexity)
```

### Image Handling

```javascript
// Process uploaded image
handleImageUpload(input)

// Display image preview
displayImagePreview(imageBox, imageData)

// Remove image from form
removeImage(imageBox)

// Show image in lightbox
showImagePreview(imageSrc, title)
```

### Prompt Analysis

```javascript
// Detect similar prompts
findDuplicatePrompts()

// Calculate text similarity (0-1)
calculateSimilarity(text1, text2)
```

### Undo/Redo

```javascript
// Save current state for undo
saveState()

// Undo last action
undo()

// Redo last undone action
redo()
```

---

## Storage Management

### Local Storage Operations

```javascript
// Save all prompts to localStorage
saveToLocalStorage()

// Save favorites list
saveFavorites()

// Save templates list
saveTemplates()

// Import data from JSON file
importData()
// File input: id="importFile"

// Export data as JSON
exportData()
// Creates downloadable JSON file with all prompts
```

### Data Format

All data is stored as JSON strings in localStorage:

```javascript
// Prompts
localStorage.getItem('promptVault')  // Returns: JSON string

// Parse to array
const prompts = JSON.parse(localStorage.getItem('promptVault'))

// Save array back
localStorage.setItem('promptVault', JSON.stringify(prompts))
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Add new prompt |
| `Ctrl+F` | Focus search input |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Shift+Z` or `Ctrl+Y` | Redo action |
| `Ctrl+S` | Show auto-save reminder |
| `Escape` | Close all modals |
| `Arrow Up/Down` | Navigate search suggestions |
| `Enter` | Select highlighted suggestion |

---

## Global State Variables

```javascript
// Data
let prompts = [];                    // All prompts array
let favorites = [];                  // Favorite prompt IDs
let templates = [];                  // Template objects
let promptVersions = {};             // Version history

// UI State
let currentCategory = 'all';         // Selected category
let editingPromptId = null;          // ID of prompt being edited
let viewMode = 'grid';               // 'grid' or 'list'
let isDarkMode = false;              // Theme state

// Undo/Redo
let undoStack = [];                  // Previous states (max 20)
let redoStack = [];                  // Undone states

// Search
let searchTimeoutId = null;          // Debounce timer ID
let searchCache = {};                // Cached search results

// Other
let imageCache = new Map();          // Temporary image storage
let lastSaveTime = Date.now();       // Last auto-save timestamp
```

---

## Error Handling

Most functions include basic error handling:

```javascript
// Try-catch blocks for critical operations
try {
  // Operation
} catch (err) {
  console.error('Error message:', err);
  showToast('User-friendly error message', 'error');
}

// Null checks for DOM elements
const element = document.getElementById('id');
if (!element) {
  console.error('Element not found');
  return;
}

// Data validation before operations
if (!title || !category || !text) {
  showToast('Please fill in all required fields', 'error');
  return;
}
```

---

## Performance Considerations

1. **Document Fragment**: DOM updates use document fragments for batch operations
2. **Debouncing**: Search input debounced by 300ms to reduce DOM manipulation
3. **Caching**: Search results cached to avoid redundant processing
4. **Image Cache**: Images stored in Map before processing to reduce file reads

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Uses:
  - `localStorage` API
  - `Clipboard API` for copying
  - `FileReader` API for images
  - `fetch` API (for future enhancements)

---

## Future Enhancements

- Cloud synchronization
- Multi-device sync
- Collaborative editing
- Advanced search filters
- Prompt versioning UI
- Export to multiple formats
- Integration with AI APIs

---

## Support & Issues

For issues or questions, refer to:
- [FEATURES.md](FEATURES.md) - Complete feature list
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Enhancement log
- [README.md](README.md) - Getting started guide
