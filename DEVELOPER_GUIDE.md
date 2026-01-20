# Prompt Vault - Developer Guide

## Getting Started

### Project Structure

```
Prompt_Library/
├── index.html          # Main HTML structure
├── style.css           # All styling (1900+ lines)
├── script.js           # Main application logic (1900+ lines)
├── README.md           # User documentation
├── FEATURES.md         # Complete feature list
├── IMPROVEMENTS.md     # Enhancement log
├── API.md              # API reference
└── DEVELOPER_GUIDE.md  # This file
```

### File Size & Metrics

- **HTML**: 335 lines
- **CSS**: 1900+ lines with animations and transitions
- **JavaScript**: 1900+ lines with comprehensive documentation
- **Total**: 4000+ lines of code

---

## Architecture Overview

### Data Flow

```
User Interaction
    ↓
Event Listener (setupEventListeners)
    ↓
Handler Function (CRUD operations)
    ↓
Data Modification (prompts array)
    ↓
Storage (localStorage)
    ↓
UI Update (loadPrompts/updateStatistics)
    ↓
Display (HTML rendering)
```

### Component Breakdown

#### 1. **Data Management**
- `prompts` - Main data array
- `favorites` - Favorite IDs
- `templates` - Saved templates
- `promptVersions` - Version history
- `imageCache` - Temporary image storage

#### 2. **UI Components**
- Header with controls
- Sidebar with filters and stats
- Main prompt grid/list
- Multiple modal dialogs
- Toast notifications
- Floating Action Button (FAB)

#### 3. **Core Modules**

| Module | Purpose |
|--------|---------|
| CRUD Operations | Create, read, update, delete prompts |
| Image Handling | Upload, preview, manage images |
| Search & Filter | Find prompts by text, tags, category |
| Templates | Save and load prompt templates |
| Favorites | Bookmark favorite prompts |
| Statistics | Analytics and metrics |
| Undo/Redo | Action history management |
| UI Utilities | Modals, toasts, form management |

---

## Key Coding Patterns

### 1. Event Delegation

```javascript
// Single listener for multiple buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.action-btn.copy')) {
        const button = e.target.closest('.action-btn.copy');
        const promptId = button.dataset.id;
        if (promptId) {
            copyPrompt(promptId);
        }
    }
});
```

### 2. Document Fragments for Performance

```javascript
// Batch DOM updates
const fragment = document.createDocumentFragment();
filteredPrompts.forEach(prompt => {
    const promptCard = createPromptCard(prompt);
    fragment.appendChild(promptCard);
});
promptGrid.appendChild(fragment);
```

### 3. Debouncing for Search

```javascript
let searchTimeoutId = null;

searchInput.addEventListener('input', function(e) {
    if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
    }
    
    // Debounce by 300ms
    searchTimeoutId = setTimeout(() => {
        performSearch(e.target.value);
    }, 300);
});
```

### 4. State Management

```javascript
let prompts = JSON.parse(localStorage.getItem('promptVault')) || [];

// Save state for undo
function saveState() {
    undoStack.push(JSON.parse(JSON.stringify(prompts)));
    redoStack = []; // Clear redo on new action
}

// Persist to storage
function saveToLocalStorage() {
    localStorage.setItem('promptVault', JSON.stringify(prompts));
}
```

### 5. Lazy Modal Content Loading

```javascript
// Content loaded on demand
function loadTemplatesModal() {
    const templatesList = document.getElementById('templatesList');
    templatesList.innerHTML = templates.map(template => 
        // Generate HTML
    ).join('');
}

// Show when ready
showModal('templatesModal');
```

---

## Development Workflow

### Adding a New Feature

1. **Update HTML** (`index.html`)
   - Add new buttons or UI elements
   - Add modal if needed
   - Use consistent class naming

2. **Add CSS** (`style.css`)
   - Style new elements
   - Include animations/transitions
   - Support dark mode variant

3. **Add JavaScript** (`script.js`)
   - Implement handler functions
   - Add to setupEventListeners()
   - Document with JSDoc comments
   - Handle errors with try-catch
   - Update localStorage as needed

4. **Test**
   - Manual testing in browser
   - Test all CRUD operations
   - Verify localStorage persistence
   - Check responsive design
   - Test with dark mode

5. **Document**
   - Update API.md with new functions
   - Update FEATURES.md with new capability
   - Add to IMPROVEMENTS.md
   - Include code comments

### Example: Adding a New Action Button

**1. HTML (index.html)**
```html
<button class="action-btn share" data-id="${prompt.id}" title="Share Prompt">
    <i class="fas fa-share"></i>
</button>
```

**2. CSS (style.css)**
```css
.action-btn.share:hover {
    background: var(--primary-color);
    color: white;
}
```

**3. JavaScript (script.js)**
```javascript
// In setupEventListeners()
if (e.target.closest('.action-btn.share')) {
    const button = e.target.closest('.action-btn.share');
    const promptId = button.dataset.id;
    if (promptId) {
        sharePrompt(promptId);
    }
}

// New function
function sharePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    // Implement sharing logic
}
```

---

## Common Tasks

### 1. Add a New Modal

```html
<!-- In index.html -->
<div id="newModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Title</h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Content here -->
        </div>
    </div>
</div>
```

```javascript
// In script.js
showModal('newModal');
closeAllModals();
```

### 2. Add Form Validation

```javascript
function validateForm() {
    const title = document.getElementById('promptTitle').value.trim();
    const category = document.getElementById('promptCategory').value;
    const text = document.getElementById('promptText').value.trim();
    
    if (!title || !category || !text) {
        showToast('Please fill in all required fields', 'error');
        return false;
    }
    
    return true;
}
```

### 3. Add Animation

```css
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.new-element {
    animation: slideIn 0.3s ease-out;
}
```

### 4. Add to Statistics

```javascript
function updateDetailedStatistics() {
    // ... existing code ...
    
    let newMetric = 0;
    prompts.forEach(prompt => {
        // Calculate metric
        newMetric += calculateMetric(prompt);
    });
    
    document.getElementById('newStatId').textContent = newMetric;
}
```

### 5. Add Keyboard Shortcut

```javascript
document.addEventListener('keydown', function(e) {
    // Ctrl+X for new feature
    if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        newFeatureAction();
    }
});
```

---

## Debugging Tips

### 1. Check Console

```javascript
// All functions log to console
console.log('Action:', promptId);
console.error('Error:', err);
```

### 2. Inspect Data

```javascript
// In browser console
console.log(prompts);                    // All prompts
console.log(favorites);                  // Favorite IDs
console.log(localStorage);               // All storage
```

### 3. Test Storage

```javascript
// Clear storage to reset
localStorage.clear();

// Save debug data
localStorage.setItem('debug', JSON.stringify({...}));

// Retrieve
JSON.parse(localStorage.getItem('debug'));
```

### 4. Monitor Events

```javascript
// Add logging to event listeners
document.addEventListener('click', function(e) {
    console.log('Clicked:', e.target);
});
```

---

## Performance Optimization

### Current Optimizations

1. **Document Fragments**: Batch DOM updates
2. **Debouncing**: Search input debounced (300ms)
3. **Caching**: Search results cached
4. **Lazy Loading**: Content loaded on demand
5. **CSS Animations**: Use transform/opacity (GPU-accelerated)

### Future Optimizations

1. **Virtual Scrolling**: For large datasets (1000+ prompts)
2. **Web Workers**: Offload search/analysis to worker thread
3. **Service Workers**: Offline support
4. **IndexedDB**: For larger data sets
5. **Code Splitting**: Load features on demand

---

## Testing Checklist

- [ ] Add new prompt
- [ ] Edit existing prompt
- [ ] Delete prompt with confirmation
- [ ] Copy prompt text
- [ ] Add to favorites
- [ ] Create template
- [ ] Load template
- [ ] Search functionality
- [ ] Filter by category
- [ ] Toggle view mode
- [ ] Toggle theme
- [ ] Export data
- [ ] Import data
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Keyboard shortcuts work
- [ ] Undo/redo functionality
- [ ] Toast notifications appear

---

## Browser DevTools Tips

### 1. Debug Async Operations

```javascript
// Add breakpoint in event listener
document.addEventListener('click', (e) => {
    debugger; // Code pauses here
});
```

### 2. Monitor Network

- Open DevTools → Network tab
- Check for file size issues
- Verify image uploads

### 3. Inspect CSS

- Select element
- Check computed styles
- Verify media queries

### 4. Storage Inspection

- DevTools → Application → Local Storage
- Edit/delete items directly
- Monitor changes

---

## Code Style Guide

### Naming Conventions

```javascript
// Variables: camelCase
let currentCategory = 'all';
const maxPrompts = 1000;

// Functions: camelCase
function addNewPrompt() {}
function toggleFavorite(promptId) {}

// Classes: PascalCase (if used)
class PromptManager {}

// Constants: UPPER_SNAKE_CASE
const MAX_IMAGE_SIZE = 5000000;
const DEFAULT_VIEW_MODE = 'grid';
```

### Comments

```javascript
// Single line comment
const value = 10;

/**
 * Multi-line JSDoc for functions
 * @param {type} paramName - Description
 * @returns {type} Description
 */
function exampleFunction(paramName) {
    // Implementation details
}
```

### Formatting

```javascript
// 4-space indentation
if (condition) {
    doSomething();
}

// Space after keywords
if (condition) {}
for (let i = 0; i < length; i++) {}

// Consistent quote usage (use single quotes)
const str = 'example';
const html = `<div>${variable}</div>`;
```

---

## Troubleshooting

### Problem: Changes not saving

- **Check**: localStorage is enabled
- **Solution**: Clear localStorage and reload

### Problem: Images not displaying

- **Check**: Image base64 encoding completed
- **Solution**: Check imageCache Map contents

### Problem: Modal won't close

- **Check**: closeAllModals() called
- **Solution**: Verify modal.active class removed

### Problem: Search not working

- **Check**: Search debounce timer
- **Solution**: Verify searchInput element exists

---

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [CSS Tricks](https://css-tricks.com/)
- [Font Awesome Icons](https://fontawesome.com/)

---

## Contributing

1. Create a feature branch
2. Make changes following code style
3. Test thoroughly
4. Update documentation
5. Submit pull request

---

## Questions?

Refer to:
- `API.md` - Function reference
- `FEATURES.md` - Feature overview
- Code comments in files
