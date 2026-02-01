// ============================================
// PROMPT VAULT - Enhanced AI Prompt Library
// ============================================
/**
 * @fileoverview Main application logic for Prompt Vault
 * A comprehensive web application for managing, organizing, and analyzing AI prompts
 * 
 * FEATURES:
 * - Create, read, update, delete (CRUD) prompts
 * - Favorite/bookmark prompts
 * - Organize prompts by categories and tags
 * - Save and load templates
 * - Search with autocomplete suggestions
 * - Dark/light theme toggle
 * - Multiple view modes (grid/list)
 * - Undo/redo functionality
 * - Import/export data as JSON
 * - Prompt statistics and analytics
 * - Keyboard shortcuts and accessibility
 * - Image attachments and previews
 * - Prompt rating and complexity analysis
 * 
 * KEYBOARD SHORTCUTS:
 * - Ctrl+N: Add new prompt
 * - Ctrl+F: Focus search
 * - Ctrl+Z: Undo
 * - Ctrl+Shift+Z / Ctrl+Y: Redo
 * - Ctrl+S: Toggle auto-save notification
 * - Escape: Close modals
 * - Arrow Keys: Navigate suggestions (in search dropdown)
 * - Enter: Select highlighted suggestion
 * 
 * VERSION: 2.0+
 * AUTHOR: Prompt Vault Team
 * LAST UPDATED: January 2026
 */

// ============================================
// Prompt Vault - Script.js (Enhanced Version)
// ============================================

// ============================================
// GLOBAL STATE AND DATA MANAGEMENT
// ============================================

// ============================================
// DATA INITIALIZATION
// ============================================
let prompts = JSON.parse(localStorage.getItem('promptVault')) || [];
let favorites = JSON.parse(localStorage.getItem('promptFavorites')) || [];
let templates = JSON.parse(localStorage.getItem('promptTemplates')) || [];
let currentCategory = 'favorites'; // Default to favorites instead of 'all'
let editingPromptId = null;
let pendingConfirmAction = null;
let imageCache = new Map();
let viewMode = 'grid'; // 'grid' or 'list'
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let undoStack = [];
let redoStack = [];
let lastSaveTime = Date.now();
let searchTimeoutId = null; // For debouncing search
let searchCache = {}; // Cache search results
let promptVersions = JSON.parse(localStorage.getItem('promptVersions')) || {}; // For versioning feature

// Initialize dark mode
if (isDarkMode) {
    document.body.classList.add('dark-mode');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app with', prompts.length, 'prompts');
    
    // Load initial data
    loadPrompts();
    updateStatistics();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for shared prompt in URL
    checkSharedPrompt();
    
    // Initialize empty state
    updateEmptyState();
    
    // Add some sample data if empty (for testing)
    if (prompts.length === 0) {
        addSampleData();
    }
}

function addSampleData() {
    console.log('Adding sample data...');
    prompts = [
        {
            id: generateId(),
            title: "Fantasy Landscape Painting",
            category: "art",
            tags: ["landscape", "fantasy", "painting", "detailed"],
            text: "A breathtaking fantasy landscape with towering mountains, a mystical forest, and a crystal-clear river flowing through the valley. Digital painting, highly detailed, epic scale, cinematic lighting, by Albert Bierstadt and Thomas Kinkade, 8K resolution",
            notes: "Works best with DALL-E 3 or Midjourney v5.2",
            resultImages: [],
            inputImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            title: "Python Data Analysis Script",
            category: "code",
            tags: ["python", "data", "analysis", "pandas"],
            text: "Create a Python script using pandas to analyze a CSV dataset. Include data cleaning, visualization with matplotlib, and statistical summary. Add comments explaining each step.",
            notes: "Adjust column names based on your dataset",
            resultImages: [],
            inputImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    saveToLocalStorage();
    loadPrompts();
    updateStatistics();
    console.log('Sample data added');
}

// ============================================
// DATA MANAGEMENT FUNCTIONS
// ============================================

function loadPrompts() {
    console.log('Loading prompts...');
    const promptGrid = document.getElementById('promptGrid');
    if (!promptGrid) {
        console.error('promptGrid element not found!');
        return;
    }
    
    promptGrid.innerHTML = '';
    
    // Filter prompts by current category
    let filteredPrompts = prompts;
    if (currentCategory === 'favorites') {
        // Filter to show only favorites
        filteredPrompts = prompts.filter(prompt => favorites.includes(prompt.id));
    } else if (currentCategory !== 'all') {
        filteredPrompts = prompts.filter(prompt => prompt.category === currentCategory);
    }
    
    // Display prompts - use document fragment for better performance
    if (filteredPrompts.length === 0) {
        updateEmptyState();
        return;
    }
    
    // Use document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    filteredPrompts.forEach(prompt => {
        const promptCard = createPromptCard(prompt);
        fragment.appendChild(promptCard);
    });
    promptGrid.appendChild(fragment);
    
    // Hide empty state if there are prompts
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    console.log('Loaded', filteredPrompts.length, 'prompts');
}

function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.dataset.id = prompt.id;
    
    const categoryClass = `prompt-category ${prompt.category}`;
    const date = new Date(prompt.createdAt).toLocaleDateString();
    
    // Calculate stats
    const wordCount = calculateWordCount(prompt.text);
    const tokenCount = estimateTokenCount(prompt.text);
    const complexity = calculateComplexity(prompt);
    const rating = prompt.rating || 0;
    
    // Create result images HTML - IMPROVED STYLING
    let resultImagesHtml = '';
    if (prompt.resultImages && prompt.resultImages.length > 0) {
        resultImagesHtml = `
            <div class="image-gallery result-images">
                <div class="image-gallery-header">
                    <h4><i class="fas fa-images"></i> Result Examples</h4>
                    <span class="image-badge">${prompt.resultImages.length}</span>
                </div>
                <div class="image-thumbnails large">
                    ${prompt.resultImages.map((img, index) => `
                        <div class="image-thumb-wrapper">
                            <img src="${img}" alt="Result ${index + 1}" 
                                 class="image-thumb result" 
                                 data-preview="${img}">
                            <span class="image-index">${index + 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Create input image HTML - IMPROVED STYLING
    let inputImageHtml = '';
    if (prompt.inputImage) {
        inputImageHtml = `
            <div class="image-gallery input-image">
                <div class="image-gallery-header">
                    <h4><i class="fas fa-upload"></i> Input Reference</h4>
                    <span class="image-badge input">REF</span>
                </div>
                <div class="image-thumbnails large input-wrapper">
                    <div class="image-thumb-wrapper large">
                        <img src="${prompt.inputImage}" alt="Input Reference" 
                             class="image-thumb input" 
                             data-preview="${prompt.inputImage}">
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create tags HTML
    let tagsHtml = '';
    if (prompt.tags && prompt.tags.length > 0) {
        tagsHtml = `
            <div class="prompt-tags">
                ${prompt.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
            </div>
        `;
    }
    
    // Create stats display
    let ratingStars = '';
    if (rating > 0) {
        ratingStars = '⭐'.repeat(rating);
    }
    
    const statsHtml = `
        <div class="prompt-stats">
            <span title="Word count"><i class="fas fa-font"></i> ${wordCount} words</span>
            <span title="Token estimate"><i class="fas fa-microchip"></i> ~${tokenCount} tokens</span>
            <span title="Complexity"><i class="fas fa-chart-line"></i> ${getComplexityLabel(complexity)}</span>
            ${rating > 0 ? `<span class="prompt-rating"><i class="fas fa-star"></i> ${ratingStars}</span>` : ''}
        </div>
    `;
    
    // Check if prompt is favorited
    const isFavorited = favorites.includes(prompt.id);
    const favoriteIcon = isFavorited ? 'fas fa-heart' : 'far fa-heart';
    const favoriteTitle = isFavorited ? 'Remove from favorites' : 'Add to favorites';
    
    card.innerHTML = `
        <div class="prompt-header">
            <div class="prompt-title">
                <div class="prompt-title-text">${escapeHtml(prompt.title)}</div>
                <span class="${categoryClass}">${getCategoryDisplayName(prompt.category)}</span>
            </div>
            <button class="view-details-btn" title="View full prompt details" aria-label="View full prompt details">
                <i class="fas fa-expand" aria-hidden="true"></i>
            </button>
        </div>
        
        <div class="prompt-body compact">
            ${resultImagesHtml}
            ${inputImageHtml}
            ${statsHtml}
            ${tagsHtml}
        </div>
        
        <div class="prompt-footer">
            <div class="prompt-date">
                <i class="far fa-calendar" aria-hidden="true"></i> ${date}
            </div>
            <div class="prompt-actions">
                <button class="action-btn favorite ${isFavorited ? 'is-favorited' : ''}" data-id="${prompt.id}" title="${favoriteTitle}" aria-label="${favoriteTitle}" aria-pressed="${isFavorited}">
                    <i class="${favoriteIcon}"></i>
                </button>
                <button class="action-btn copy" data-id="${prompt.id}" title="Copy Prompt (Double-click card)" aria-label="Copy prompt to clipboard">
                    <i class="fas fa-copy" aria-hidden="true"></i>
                </button>
                <button class="action-btn edit" data-id="${prompt.id}" title="Edit Prompt" aria-label="Edit this prompt">
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
                <button class="action-btn delete" data-id="${prompt.id}" title="Delete Prompt" aria-label="Delete this prompt">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    `;
    
    // Double-click to copy
    card.addEventListener('dblclick', function(e) {
        if (e.target.closest('button')) return;
        copyPrompt(prompt.id);
    });
    
    // View details button
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showPromptDetails(prompt);
        });
    }
    
    return card;
}

// ============================================
// CRUD OPERATIONS - Prompt Management
// ============================================

/**
 * Initialize a new blank prompt form and show the modal
 * Pre-selects the current category if one is selected
 */
function addNewPrompt() {
    console.log('Adding new prompt...');
    resetForm();
    editingPromptId = null;
    
    // Pre-select current category if not viewing 'favorites' or 'all'
    if (currentCategory !== 'favorites' && currentCategory !== 'all') {
        document.getElementById('promptCategory').value = currentCategory;
    }
    
    document.getElementById('modalTitle').textContent = 'Add New Prompt';
    showModal('promptModal');
}

/**
 * Load an existing prompt into the form for editing
 * @param {string} promptId - The unique identifier of the prompt to edit
 */
function editPrompt(promptId) {
    console.log('Editing prompt:', promptId);
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
        console.error('Prompt not found:', promptId);
        return;
    }
    
    editingPromptId = promptId;
    
    // Fill form with prompt data
    document.getElementById('promptTitle').value = prompt.title;
    document.getElementById('promptCategory').value = prompt.category;
    document.getElementById('promptTags').value = prompt.tags ? prompt.tags.join(', ') : '';
    document.getElementById('promptText').value = prompt.text;
    document.getElementById('promptNotes').value = prompt.notes || '';
    document.getElementById('promptRating').value = prompt.rating || 0;
    document.getElementById('promptId').value = promptId;
    
    // Update character count
    updateCharCount();
    
    // Set rating stars
    updateRatingStars(prompt.rating || 0);
    
    // Clear existing image previews first
    document.querySelectorAll('.image-upload-box').forEach(box => {
        removeImage(box);
    });
    
    // Load result images
    if (prompt.resultImages && prompt.resultImages.length > 0) {
        prompt.resultImages.forEach((img, index) => {
            if (index < 3) {
                const imageBox = document.querySelector(`.image-upload-box[data-type="result"][data-index="${index}"]`);
                if (imageBox) {
                    displayImagePreview(imageBox, img);
                }
            }
        });
    }
    
    // Load input image
    if (prompt.inputImage) {
        const imageBox = document.querySelector('.image-upload-box[data-type="input"]');
        if (imageBox) {
            displayImagePreview(imageBox, prompt.inputImage);
        }
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Prompt';
    showModal('promptModal');
}

/**
 * Save prompt data to storage
 * Creates a new prompt if promptId is not set, otherwise updates existing prompt
 * Handles validation, image processing, and localStorage persistence
 * 
 * @param {Event} event - Form submission event
 */
function savePrompt(event) {
    event.preventDefault();
    console.log('Saving prompt...');
    
    // Get form values
    const title = document.getElementById('promptTitle').value.trim();
    const category = document.getElementById('promptCategory').value;
    const tags = document.getElementById('promptTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const text = document.getElementById('promptText').value.trim();
    const notes = document.getElementById('promptNotes').value.trim();
    const rating = parseInt(document.getElementById('promptRating').value) || 0;
    
    // Validation
    if (!title || !category || !text) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Get result images
    const resultImages = [];
    document.querySelectorAll('.image-upload-box[data-type="result"]').forEach(box => {
        if (box.classList.contains('has-image')) {
            const img = imageCache.get(box.id);
            if (img) resultImages.push(img);
        }
    });
    
    // Get input image
    let inputImage = null;
    const inputImageBox = document.querySelector('.image-upload-box[data-type="input"]');
    if (inputImageBox && inputImageBox.classList.contains('has-image')) {
        inputImage = imageCache.get(inputImageBox.id);
    }
    
    saveState(); // Save for undo
    
    if (editingPromptId) {
        // Update existing prompt
        const index = prompts.findIndex(p => p.id === editingPromptId);
        if (index !== -1) {
            prompts[index] = {
                ...prompts[index],
                title,
                category,
                tags,
                text,
                notes: notes || '',
                rating,
                resultImages,
                inputImage,
                updatedAt: new Date().toISOString()
            };
            showToast('Prompt updated successfully!', 'success');
        }
    } else {
        // Create new prompt
        const newPrompt = {
            id: generateId(),
            title,
            category,
            tags,
            text,
            notes: notes || '',
            rating,
            resultImages,
            inputImage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        prompts.unshift(newPrompt);
        showToast('Prompt added successfully!', 'success');
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Clear search cache to ensure fresh results
    searchCache = {};
    
    // Update UI
    loadPrompts();
    updateStatistics();
    closeAllModals();
}

/**
 * Delete a prompt with confirmation
 * Shows confirmation dialog before permanently removing the prompt
 * Also removes from favorites if applicable
 * 
 * @param {string} promptId - The unique identifier of the prompt to delete
 */
function deletePrompt(promptId) {
    console.log('Deleting prompt:', promptId);
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
        console.error('Prompt not found:', promptId);
        return;
    }
    
    showConfirmModal(
        'Delete Prompt',
        `Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`,
        () => {
            // Remove from array
            const index = prompts.findIndex(p => p.id === promptId);
            if (index !== -1) {
                prompts.splice(index, 1);
                
                // Remove from favorites if it was favorited
                const favIndex = favorites.indexOf(promptId);
                if (favIndex !== -1) {
                    favorites.splice(favIndex, 1);
                }
                
                // Save to localStorage
                saveToLocalStorage();
                saveFavorites();
                
                // Clear search cache
                searchCache = {};
                
                // Update UI
                loadPrompts();
                updateStatistics();
                showToast('Prompt deleted successfully!', 'success');
            }
        }
    );
}

/**
 * Toggle favorite status for a prompt
 * @param {string} promptId - The ID of the prompt to favorite
 */
function toggleFavorite(promptId) {
    const index = favorites.indexOf(promptId);
    const card = document.querySelector(`[data-id="${promptId}"]`);
    const button = card?.querySelector('.action-btn.favorite');
    
    if (index === -1) {
        // Add to favorites
        favorites.push(promptId);
        if (button) {
            button.classList.add('is-favorited');
            button.setAttribute('aria-pressed', 'true');
            button.title = 'Remove from favorites';
            button.setAttribute('aria-label', 'Remove from favorites');
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }
        showToast('Added to favorites!', 'success');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        if (button) {
            button.classList.remove('is-favorited');
            button.setAttribute('aria-pressed', 'false');
            button.title = 'Add to favorites';
            button.setAttribute('aria-label', 'Add to favorites');
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        }
        showToast('Removed from favorites!', 'info');
    }
    
    saveFavorites();
    updateStatistics();
    
    // If in favorites view, reload to remove the prompt
    if (currentCategory === 'favorites') {
        loadPrompts();
    }
}

// ============================================
// IMAGE HANDLING FUNCTIONS
// ============================================

function handleImageUpload(input) {
    console.log('Handling image upload...');
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    const imageBox = input.parentElement;
    const index = imageBox.dataset.index;
    const type = imageBox.dataset.type;
    
    reader.onload = function(e) {
        const imageData = e.target.result;
        const cacheId = `${type}-${index}`;
        
        // Cache the image
        imageCache.set(cacheId, imageData);
        
        // Display preview
        displayImagePreview(imageBox, imageData);
    };
    
    reader.readAsDataURL(file);
}

function displayImagePreview(imageBox, imageData) {
    // Clear existing preview
    const existingPreview = imageBox.querySelector('.image-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Remove existing remove button
    const existingRemoveBtn = imageBox.querySelector('.remove-image');
    if (existingRemoveBtn) {
        existingRemoveBtn.remove();
    }
    
    // Create new preview
    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'image-preview';
    img.alt = 'Preview';
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-icon remove-image';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.title = 'Remove image';
    removeBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeImage(imageBox);
    };
    
    imageBox.appendChild(img);
    imageBox.appendChild(removeBtn);
    imageBox.classList.add('has-image');
    
    // Update cache ID
    const type = imageBox.dataset.type;
    const index = imageBox.dataset.index;
    imageBox.id = `${type}-${index}`;
}

function removeImage(imageBox) {
    console.log('Removing image...');
    // Clear preview
    const preview = imageBox.querySelector('.image-preview');
    const removeBtn = imageBox.querySelector('.remove-image');
    
    if (preview) preview.remove();
    if (removeBtn) removeBtn.remove();
    
    // Clear from cache
    const cacheId = imageBox.id;
    imageCache.delete(cacheId);
    
    // Reset image box
    imageBox.classList.remove('has-image');
    imageBox.id = '';
    
    // Reset file input
    const fileInput = imageBox.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.value = '';
    }
}

function loadImageFromUrl(url, imageType = 'input') {
    console.log('Loading image from URL:', url, 'Type:', imageType);
    
    // Validate URL format
    try {
        new URL(url);
    } catch {
        showToast('Invalid URL format', 'error');
        return;
    }
    
    // Get the appropriate image box based on type
    let imageBox;
    if (imageType === 'input') {
        imageBox = document.querySelector('[data-type="input"]');
    } else if (imageType === 'result') {
        // For result images, find the first empty one or the last one
        const resultBoxes = Array.from(document.querySelectorAll('[data-type="result"]'));
        imageBox = resultBoxes.find(box => !box.classList.contains('has-image')) || resultBoxes[resultBoxes.length - 1];
    }
    
    if (!imageBox) {
        showToast('Image upload area not found', 'error');
        return;
    }
    
    // Create an image element to load and validate the URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
        // Convert canvas to data URL to handle CORS
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        
        // Cache the image
        const index = imageBox.dataset.index;
        const type = imageBox.dataset.type;
        const cacheId = `${type}-${index}`;
        imageCache.set(cacheId, imageData);
        
        // Display preview
        displayImagePreview(imageBox, imageData);
        showToast('Image loaded successfully!', 'success');
    };
    
    img.onerror = function() {
        showToast('Failed to load image. Check the URL or CORS settings.', 'error');
        console.error('Image loading failed for URL:', url);
    };
    
    img.src = url;
}

function showImagePreview(imageSrc, title) {
    console.log('Showing image preview:', title);
    document.getElementById('modalImage').src = imageSrc;
    document.getElementById('imageModalTitle').textContent = title;
    showModal('imageModal');
}

function showPromptDetails(prompt) {
    console.log('Showing prompt details:', prompt.title);
    
    // Calculate stats
    const wordCount = calculateWordCount(prompt.text);
    const tokenCount = estimateTokenCount(prompt.text);
    const complexity = calculateComplexity(prompt);
    const rating = prompt.rating || 0;
    
    // Create rating stars
    let ratingStars = '';
    if (rating > 0) {
        ratingStars = '⭐'.repeat(rating);
    }
    
    // Create result images HTML
    let resultImagesHtml = '';
    if (prompt.resultImages && prompt.resultImages.length > 0) {
        resultImagesHtml = `
            <div class="image-gallery result-images">
                <div class="image-gallery-header">
                    <h4><i class="fas fa-images"></i> Result Examples</h4>
                    <span class="image-badge">${prompt.resultImages.length}</span>
                </div>
                <div class="image-thumbnails large">
                    ${prompt.resultImages.map((img, index) => `
                        <div class="image-thumb-wrapper">
                            <img src="${img}" alt="Result ${index + 1}" 
                                 class="image-thumb result" 
                                 data-preview="${img}">
                            <span class="image-index">${index + 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Create input image HTML
    let inputImageHtml = '';
    if (prompt.inputImage) {
        inputImageHtml = `
            <div class="image-gallery input-image">
                <div class="image-gallery-header">
                    <h4><i class="fas fa-upload"></i> Input Reference</h4>
                    <span class="image-badge input">REF</span>
                </div>
                <div class="image-thumbnails large input-wrapper">
                    <div class="image-thumb-wrapper large">
                        <img src="${prompt.inputImage}" alt="Input Reference" 
                             class="image-thumb input" 
                             data-preview="${prompt.inputImage}">
                    </div>
                </div>
            </div>
        `;
    }
    
    // Create tags HTML
    let tagsHtml = '';
    if (prompt.tags && prompt.tags.length > 0) {
        tagsHtml = `
            <div class="prompt-tags">
                ${prompt.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
            </div>
        `;
    }
    
    // Create stats display
    const statsHtml = `
        <div class="prompt-stats">
            <span title="Word count"><i class="fas fa-font"></i> ${wordCount} words</span>
            <span title="Token estimate"><i class="fas fa-microchip"></i> ~${tokenCount} tokens</span>
            <span title="Complexity"><i class="fas fa-chart-line"></i> ${getComplexityLabel(complexity)}</span>
            ${rating > 0 ? `<span class="prompt-rating"><i class="fas fa-star"></i> ${ratingStars}</span>` : ''}
        </div>
    `;
    
    // Set modal content
    const modalContent = document.querySelector('#promptDetailsModal .modal-body');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="prompt-details-view">
                <div class="prompt-details-header">
                    <h2>${escapeHtml(prompt.title)}</h2>
                    <span class="category-badge category-${prompt.category}">${getCategoryDisplayName(prompt.category)}</span>
                </div>
                
                ${resultImagesHtml}
                ${inputImageHtml}
                
                <div class="prompt-full-text">
                    <h4><i class="fas fa-quote-left"></i> Prompt Text</h4>
                    <p>${escapeHtml(prompt.text).replace(/\n/g, '<br>')}</p>
                </div>
                
                ${statsHtml}
                ${tagsHtml}
                
                ${prompt.notes ? `
                    <div class="prompt-full-notes">
                        <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                        <p>${escapeHtml(prompt.notes).replace(/\n/g, '<br>')}</p>
                    </div>
                ` : ''}
                
                <div class="prompt-details-footer">
                    <span class="prompt-meta">
                        <i class="far fa-calendar"></i> Created: ${new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                    <span class="prompt-meta">
                        <i class="far fa-calendar-check"></i> Updated: ${new Date(prompt.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `;
    }
    
    showModal('promptDetailsModal');
}

// ============================================
// IMPORT/EXPORT FUNCTIONS
// ============================================

function exportData() {
    console.log('Exporting data...');
    if (prompts.length === 0) {
        showToast('No prompts to export', 'warning');
        return;
    }
    
    // Create export data
    const exportData = {
        prompts: prompts,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalPrompts: prompts.length
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `prompt-vault-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully!', 'success');
}

function importData() {
    console.log('Importing data...');
    document.getElementById('importFile').click();
}

function handleFileImport(event) {
    console.log('Handling file import...');
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        showToast('Please select a JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!importedData.prompts || !Array.isArray(importedData.prompts)) {
                throw new Error('Invalid file format');
            }
            
            showConfirmModal(
                'Import Data',
                `This will import ${importedData.prompts.length} prompts. Your current prompts will be replaced. Continue?`,
                () => {
                    // Replace current prompts with imported data
                    prompts = importedData.prompts;
                    
                    // Ensure all prompts have required fields
                    prompts = prompts.map(prompt => ({
                        id: prompt.id || generateId(),
                        title: prompt.title || 'Untitled',
                        category: prompt.category || 'other',
                        tags: prompt.tags || [],
                        text: prompt.text || '',
                        notes: prompt.notes || '',
                        resultImages: prompt.resultImages || [],
                        inputImage: prompt.inputImage || null,
                        createdAt: prompt.createdAt || new Date().toISOString(),
                        updatedAt: prompt.updatedAt || new Date().toISOString()
                    }));
                    
                    // Save to localStorage
                    saveToLocalStorage();
                    
                    // Update UI
                    loadPrompts();
                    updateStatistics();
                    showToast(`Successfully imported ${prompts.length} prompts!`, 'success');
                    
                    // Reset file input
                    event.target.value = '';
                }
            );
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing file. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Share a prompt via URL
 * Creates a shareable link with encoded prompt data
 * @param {string} promptId - The prompt to share
 */
function sharePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
        showToast('Prompt not found', 'error');
        return;
    }
    
    // Create shareable data (excluding images to keep URL shorter)
    const shareData = {
        title: prompt.title,
        category: prompt.category,
        tags: prompt.tags,
        text: prompt.text,
        notes: prompt.notes,
        rating: prompt.rating
    };
    
    // Encode as base64
    const encodedPrompt = btoa(JSON.stringify(shareData));
    
    // Create shareable URL (using current domain with hash parameter)
    const shareUrl = window.location.origin + window.location.pathname + 
                     '?shared=' + encodedPrompt;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Share link copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback: show in alert if copy fails
        alert('Share URL:\n\n' + shareUrl);
    });
}

/**
 * Import shared prompt from URL
 * Checks URL parameters for shared prompt data
 */
function checkSharedPrompt() {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('shared');
    
    if (!sharedData) return;
    
    try {
        const promptData = JSON.parse(atob(sharedData));
        
        // Load into form
        document.getElementById('promptTitle').value = promptData.title || '';
        document.getElementById('promptCategory').value = promptData.category || 'other';
        document.getElementById('promptTags').value = (promptData.tags || []).join(', ');
        document.getElementById('promptText').value = promptData.text || '';
        document.getElementById('promptNotes').value = promptData.notes || '';
        if (promptData.rating) {
            document.getElementById('promptRating').value = promptData.rating;
            updateRatingStars(promptData.rating);
        }
        
        updateCharCount();
        showToast('Shared prompt loaded! Edit and save to add it to your library.', 'info');
        
        // Show modal
        showModal('promptModal');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
        console.error('Error loading shared prompt:', error);
        showToast('Error loading shared prompt', 'error');
    }
}

/**
 * Export a single prompt as shareable JSON
 * @param {string} promptId - The prompt to export
 */
function exportSinglePrompt(promptId) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
        showToast('Prompt not found', 'error');
        return;
    }
    
    const jsonString = JSON.stringify(prompt, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `${prompt.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Prompt exported successfully!', 'success');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function getCategoryDisplayName(category) {
    const categoryNames = {
        'art': 'Art & Images',
        'writing': 'Writing',
        'code': 'Code & Technical',
        'analysis': 'Analysis',
        'creative': 'Creative',
        'other': 'Other'
    };
    return categoryNames[category] || category;
}

// ============================================
// ANALYTICS AND STATISTICS FUNCTIONS
// ============================================

function calculateWordCount(text) {
    return text.trim().split(/\s+/).length;
}

function estimateTokenCount(text) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}

function calculateComplexity(prompt) {
    const wordCount = calculateWordCount(prompt.text);
    const hasDetails = prompt.notes ? prompt.notes.length > 50 : false;
    const hasImages = prompt.resultImages && prompt.resultImages.length > 0;
    const tagCount = prompt.tags ? prompt.tags.length : 0;
    
    let score = 1;
    if (wordCount > 100) score += 1;
    if (wordCount > 200) score += 1;
    if (hasDetails) score += 1;
    if (hasImages) score += 1;
    if (tagCount >= 3) score += 1;
    
    return Math.min(score, 5);
}

function getComplexityLabel(complexity) {
    if (complexity <= 1) return 'Simple';
    if (complexity <= 2) return 'Basic';
    if (complexity <= 3) return 'Moderate';
    if (complexity <= 4) return 'Complex';
    return 'Very Complex';
}

// ============================================
// UNDO/REDO FUNCTIONALITY
// ============================================

function saveState() {
    undoStack.push(JSON.stringify(prompts));
    redoStack = [];
    // Limit undo history to 20 states
    if (undoStack.length > 20) {
        undoStack.shift();
    }
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(JSON.stringify(prompts));
        prompts = JSON.parse(undoStack.pop());
        saveToLocalStorage();
        loadPrompts();
        updateStatistics();
        showToast('Action undone', 'info');
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.stringify(prompts));
        prompts = JSON.parse(redoStack.pop());
        saveToLocalStorage();
        loadPrompts();
        updateStatistics();
        showToast('Action redone', 'info');
    }
}

// ============================================
// SEARCH AND SUGGESTIONS
// ============================================

function generateSearchSuggestions(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('searchSuggestions').classList.remove('active');
        return;
    }
    
    const suggestions = new Set();
    const lowerSearch = searchTerm.toLowerCase();
    
    prompts.forEach(prompt => {
        if (prompt.title.toLowerCase().includes(lowerSearch)) {
            suggestions.add(prompt.title);
        }
        if (prompt.tags) {
            prompt.tags.forEach(tag => {
                if (tag.toLowerCase().includes(lowerSearch)) {
                    suggestions.add(`Tag: ${tag}`);
                }
            });
        }
    });
    
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (suggestions.size > 0) {
        suggestionsDiv.innerHTML = Array.from(suggestions).slice(0, 5).map(suggestion => `
            <div class="suggestion-item" role="option">${escapeHtml(suggestion)}</div>
        `).join('');
        suggestionsDiv.classList.add('active');
    } else {
        suggestionsDiv.classList.remove('active');
    }
}

/**
 * Navigate through search suggestions with arrow keys
 * @param {number} direction - 1 for down, -1 for up
 */
function navigateSuggestions(direction) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const items = suggestionsDiv.querySelectorAll('.suggestion-item');
    const current = suggestionsDiv.querySelector('.suggestion-item.highlighted');
    
    if (items.length === 0) return;
    
    let nextItem;
    if (!current) {
        nextItem = direction > 0 ? items[0] : items[items.length - 1];
    } else {
        const currentIndex = Array.from(items).indexOf(current);
        let nextIndex = currentIndex + direction;
        
        // Wrap around
        if (nextIndex >= items.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = items.length - 1;
        
        nextItem = items[nextIndex];
    }
    
    // Remove previous highlight
    items.forEach(item => item.classList.remove('highlighted'));
    
    // Add highlight to new item
    if (nextItem) {
        nextItem.classList.add('highlighted');
        nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ============================================
// DUPLICATE DETECTION
// ============================================

function findDuplicatePrompts() {
    const duplicates = [];
    
    for (let i = 0; i < prompts.length; i++) {
        for (let j = i + 1; j < prompts.length; j++) {
            const similarity = calculateSimilarity(prompts[i].text, prompts[j].text);
            if (similarity > 0.7) {
                duplicates.push({
                    prompt1: prompts[i],
                    prompt2: prompts[j],
                    similarity: Math.round(similarity * 100)
                });
            }
        }
    }
    
    return duplicates;
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
    const costs = [];
    
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
}

function updateStatistics() {
    console.log('Updating statistics...');
    const totalPrompts = prompts.length;
    const totalFavorites = favorites.length;
    const categories = new Set(prompts.map(p => p.category)).size;
    const promptsWithImages = prompts.filter(p => p.resultImages && p.resultImages.length > 0).length;
    
    document.getElementById('totalPrompts').textContent = totalPrompts;
    document.getElementById('totalFavorites').textContent = totalFavorites;
    document.getElementById('totalCategories').textContent = categories;
    document.getElementById('promptsWithImages').textContent = promptsWithImages;
    
    // Update stats modal if it exists
    if (document.getElementById('statTotalPrompts')) {
        updateDetailedStatistics();
    }
}

function updateDetailedStatistics() {
    const totalPrompts = prompts.length;
    const allTags = new Set();
    let totalWords = 0;
    let totalRating = 0;
    let ratedCount = 0;
    
    prompts.forEach(prompt => {
        if (prompt.tags) {
            prompt.tags.forEach(tag => allTags.add(tag));
        }
        totalWords += calculateWordCount(prompt.text);
        if (prompt.rating && prompt.rating > 0) {
            totalRating += prompt.rating;
            ratedCount++;
        }
    });
    
    const avgWords = totalPrompts > 0 ? Math.round(totalWords / totalPrompts) : 0;
    const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0;
    
    document.getElementById('statTotalPrompts').textContent = totalPrompts;
    document.getElementById('statTotalTags').textContent = allTags.size;
    const promptsWithImages = prompts.filter(p => p.resultImages && p.resultImages.length > 0).length;
    document.getElementById('statPromptsWithImages').textContent = promptsWithImages;
    document.getElementById('statCategoriesUsed').textContent = new Set(prompts.map(p => p.category)).size;
    document.getElementById('statAvgWords').textContent = avgWords;
    document.getElementById('statAvgRating').textContent = avgRating === 0 ? 'N/A' : `${avgRating}/5`;
    
    // Update category breakdown
    updateCategoryBreakdown();
}

function updateCategoryBreakdown() {
    const breakdown = {};
    prompts.forEach(prompt => {
        breakdown[prompt.category] = (breakdown[prompt.category] || 0) + 1;
    });
    
    const total = prompts.length;
    const breakdownDiv = document.getElementById('categoryBreakdown');
    
    breakdownDiv.innerHTML = Object.entries(breakdown)
        .map(([category, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return `
                <div class="category-bar">
                    <div class="category-bar-label">${getCategoryDisplayName(category)}</div>
                    <div class="category-bar-container">
                        <div class="category-bar-fill" style="width: ${percentage}%">${percentage}%</div>
                    </div>
                    <span>${count}</span>
                </div>
            `;
        })
        .join('');
}

function updateRatingStars(rating) {
    document.querySelectorAll('#ratingInput .star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateEmptyState() {
    console.log('Updating empty state...');
    const emptyState = document.getElementById('emptyState');
    const promptGrid = document.getElementById('promptGrid');
    
    if (!emptyState || !promptGrid) {
        console.error('Empty state or prompt grid not found!');
        return;
    }
    
    let filteredPrompts = prompts;
    if (currentCategory !== 'all') {
        filteredPrompts = prompts.filter(prompt => prompt.category === currentCategory);
    }
    
    if (filteredPrompts.length === 0) {
        emptyState.style.display = 'block';
        // Make sure empty state is at the end of the grid
        if (!promptGrid.contains(emptyState)) {
            promptGrid.appendChild(emptyState);
        }
    } else {
        emptyState.style.display = 'none';
    }
}

function updateCharCount() {
    const text = document.getElementById('promptText').value;
    document.getElementById('charCount').textContent = text.length;
}

/**
 * Copy prompt text to system clipboard
 * Shows toast notification on success or error
 * 
 * @param {string} promptId - The unique identifier of the prompt to copy
 */
function copyPrompt(promptId) {
    console.log('Copying prompt:', promptId);
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
        console.error('Prompt not found for copying:', promptId);
        return;
    }
    
    navigator.clipboard.writeText(prompt.text)
        .then(() => {
            showToast('Prompt copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy prompt', 'error');
        });
}

function saveToLocalStorage() {
    console.log('Saving to localStorage...');
    localStorage.setItem('promptVault', JSON.stringify(prompts));
}

/**
 * Save favorites list to localStorage
 */
function saveFavorites() {
    console.log('Saving favorites...');
    localStorage.setItem('promptFavorites', JSON.stringify(favorites));
}

/**
 * Save templates to localStorage
 */
function saveTemplates() {
    console.log('Saving templates...');
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
}

/**
 * Create a new template from the current form data
 */
function createTemplateFromCurrent() {
    const title = document.getElementById('promptTitle').value.trim();
    const category = document.getElementById('promptCategory').value;
    const tags = document.getElementById('promptTags').value;
    const text = document.getElementById('promptText').value.trim();
    const notes = document.getElementById('promptNotes').value.trim();
    
    if (!title || !text) {
        showToast('Please fill in title and text before creating a template', 'error');
        return;
    }
    
    const template = {
        id: generateId(),
        name: title + ' Template',
        category,
        tags,
        text,
        notes,
        createdAt: new Date().toISOString()
    };
    
    templates.push(template);
    saveTemplates();
    showToast('Template created successfully!', 'success');
    loadTemplatesModal();
}

/**
 * Load template into the form
 */
function loadTemplateIntoForm(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    resetForm();
    document.getElementById('promptTitle').value = template.name.replace(' Template', '') || '';
    document.getElementById('promptCategory').value = template.category;
    document.getElementById('promptTags').value = template.tags || '';
    document.getElementById('promptText').value = template.text;
    document.getElementById('promptNotes').value = template.notes || '';
    updateCharCount();
    
    closeAllModals();
    showToast('Template loaded! Edit as needed.', 'info');
}

/**
 * Delete a template
 */
function deleteTemplate(templateId) {
    const index = templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
        templates.splice(index, 1);
        saveTemplates();
        showToast('Template deleted!', 'info');
        loadTemplatesModal();
    }
}

/**
 * Load and display templates modal
 */
function loadTemplatesModal() {
    const templatesList = document.getElementById('templatesList');
    
    if (templates.length === 0) {
        templatesList.innerHTML = `
            <div class="empty-templates">
                <i class="fas fa-file-alt"></i>
                <p>No templates yet. Create one from your current prompt!</p>
            </div>
        `;
    } else {
        templatesList.innerHTML = templates.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <h4>${escapeHtml(template.name)}</h4>
                    <p class="template-category">${getCategoryDisplayName(template.category)}</p>
                    <p class="template-preview">${escapeHtml(template.text.substring(0, 100))}...</p>
                </div>
                <div class="template-actions">
                    <button class="btn-icon" onclick="loadTemplateIntoForm('${template.id}')" title="Load template">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteTemplate('${template.id}')" title="Delete template">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Setup create template button
    const createBtn = document.getElementById('createTemplateBtn');
    if (createBtn) {
        createBtn.onclick = createTemplateFromCurrent;
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error('Modal not found:', modalId);
        return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    console.log('Closing all modals...');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
    resetForm();
}

function resetForm() {
    console.log('Resetting form...');
    const form = document.getElementById('promptForm');
    if (form) {
        form.reset();
    }
    
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0';
    }
    
    const promptId = document.getElementById('promptId');
    if (promptId) {
        promptId.value = '';
    }
    
    // Clear image previews and cache
    document.querySelectorAll('.image-upload-box').forEach(box => {
        removeImage(box);
    });
    
    imageCache.clear();
}

function showConfirmModal(title, message, callback) {
    console.log('Showing confirm modal:', title);
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    pendingConfirmAction = callback;
    
    showModal('confirmModal');
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = 'success') {
    console.log('Showing toast:', message, type);
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('Toast element not found!');
        return;
    }
    
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set message
    toastMessage.textContent = message;
    
    // Remove all type classes
    toast.classList.remove('success', 'error', 'warning', 'info');
    
    // Set icon based on type
    switch (type) {
        case 'success':
            toastIcon.className = 'fas fa-check-circle toast-icon';
            toast.classList.add('success');
            break;
        case 'error':
            toastIcon.className = 'fas fa-exclamation-circle toast-icon';
            toast.classList.add('error');
            break;
        case 'warning':
            toastIcon.className = 'fas fa-exclamation-triangle toast-icon';
            toast.classList.add('warning');
            break;
        default:
            toastIcon.className = 'fas fa-info-circle toast-icon';
            toast.classList.add('info');
    }
    
    // Remove existing timeout if any
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Auto-hide after 4 seconds (increased from 3 for better visibility)
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ============================================
// EVENT LISTENER SETUP (FIXED)
// ============================================

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Floating Action Button
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
        fabButton.addEventListener('click', addNewPrompt);
    }
    
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            themeToggle.querySelector('i').classList.toggle('fa-moon');
            themeToggle.querySelector('i').classList.toggle('fa-sun');
            showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
        });
        // Set initial icon
        if (isDarkMode) {
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        }
    }
    
    // View Toggle Buttons
    const listViewBtn = document.getElementById('listViewBtn');
    if (listViewBtn) {
        listViewBtn.addEventListener('click', function() {
            viewMode = 'list';
            document.getElementById('gridViewBtn').classList.remove('active');
            this.classList.add('active');
            document.getElementById('promptGrid').classList.add('list-view');
            loadPrompts();
            showToast('Switched to list view', 'info');
        });
    }
    
    const gridViewBtn = document.getElementById('gridViewBtn');
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            viewMode = 'grid';
            document.getElementById('listViewBtn').classList.remove('active');
            this.classList.add('active');
            document.getElementById('promptGrid').classList.remove('list-view');
            loadPrompts();
            showToast('Switched to grid view', 'info');
        });
    }
    
    // Stats Button
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', function() {
            updateDetailedStatistics();
            showModal('statsModal');
        });
    }
    
    // Templates Button
    const templatesBtn = document.getElementById('templatesBtn');
    if (templatesBtn) {
        templatesBtn.addEventListener('click', function() {
            loadTemplatesModal();
            showModal('templatesModal');
        });
    }
    
    // Rating Stars
    const stars = document.querySelectorAll('#ratingInput .star');
    stars.forEach(star => {
        star.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.dataset.value;
            document.getElementById('promptRating').value = value;
            updateRatingStars(value);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Category filter - enhance items with edit/delete controls
    function activateCategoryItem(li) {
        document.querySelectorAll('.category-list li').forEach(i => i.classList.remove('active'));
        li.classList.add('active');
        currentCategory = li.dataset.category;
        loadPrompts();
        updateEmptyState();
    }

    function makeCategoryItem(li) {
        if (!li) return;
        // Preserve category key
        const rawName = (li.dataset.name || li.textContent).trim();
        const key = (li.dataset.category || rawName).toLowerCase();
        li.dataset.category = key;
        li.dataset.name = rawName;

        // Skip if already enhanced
        if (li.querySelector('.cat-name')) return;

        const protect = ['favorites','other'];

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cat-name';
        nameSpan.textContent = rawName;
        nameSpan.tabIndex = 0;

        const controls = document.createElement('div');
        controls.className = 'cat-controls';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-cat-edit';
        editBtn.title = 'Edit category';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';

        const addSubBtn = document.createElement('button');
        addSubBtn.className = 'btn-cat-addsub';
        addSubBtn.title = 'Add subcategory';
        addSubBtn.innerHTML = '<i class="fas fa-plus"></i>';

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-cat-delete';
        delBtn.title = 'Delete category';
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';

        if (protect.includes(key)) {
            delBtn.style.display = 'none';
        }

        controls.appendChild(addSubBtn);
        controls.appendChild(editBtn);
        controls.appendChild(delBtn);

        // Clear and append header (name + controls), so sublist goes under header
        li.innerHTML = '';
        const headerDiv = document.createElement('div');
        headerDiv.className = 'cat-header';
        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(controls);
        li.appendChild(headerDiv);

        // Click on name activates
        nameSpan.addEventListener('click', function() {
            activateCategoryItem(li);
        });

        // Keyboard support
        nameSpan.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateCategoryItem(li);
            }
        });

        // Edit handler
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const oldKey = li.dataset.category;
            const oldDisplay = li.dataset.name;
            const newDisplay = prompt('Rename category', oldDisplay);
            if (!newDisplay) return;
            const newKey = newDisplay.trim().toLowerCase();
            if (newKey === oldKey) return;

            // Check for conflicts
            const exists = Array.from(document.querySelectorAll('#categoryList li')).some(other => other.dataset.category === newKey);
            if (exists) {
                showToast('A category with that name already exists', 'warning');
                return;
            }

            // Update li and descendants
            const newDisplayTrim = newDisplay.trim();
            updateDescendantKeys(oldKey, newKey, newDisplayTrim);
            saveToLocalStorage();
            loadPrompts();
            updateStatistics();
            showToast(`Category renamed to "${newDisplayTrim}"`, 'success');
        });

        // Add subcategory handler
        addSubBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const parentKey = li.dataset.category;
            const parentDisplay = li.dataset.name;
            const subName = prompt('New subcategory name for "' + parentDisplay + '"');
            if (!subName) return;
            const subKey = subName.trim().toLowerCase();
            const combinedKey = parentKey + '/' + subKey;

            // Check for conflicts
            const exists = Array.from(document.querySelectorAll('#categoryList li')).some(other => other.dataset.category === combinedKey);
            if (exists) {
                showToast('A subcategory with that name already exists', 'warning');
                return;
            }

            // Create sub li
            let sublist = li.querySelector('.category-sublist');
            if (!sublist) {
                sublist = document.createElement('ul');
                sublist.className = 'category-sublist';
                li.appendChild(sublist);
            }

            const childLi = document.createElement('li');
            childLi.dataset.category = combinedKey;
            childLi.dataset.name = subName.trim();
            sublist.appendChild(childLi);

            // Add option to select with hierarchical label
            const select = document.getElementById('promptCategory');
            const option = document.createElement('option');
            option.value = combinedKey;
            option.textContent = parentDisplay + ' / ' + subName.trim();
            select.insertBefore(option, select.lastElementChild);

            makeCategoryItem(childLi);
            showToast('Subcategory added', 'success');
            updateStatistics();
        });

        // Delete handler
        delBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const keyToDelete = li.dataset.category;
            showConfirmModal(
                'Delete Category',
                `Delete category "${li.dataset.name}"? Prompts in this category will be moved to "Other".`,
                function() {
                    deleteCategoryAndDescendants(keyToDelete, li);
                    saveToLocalStorage();
                    loadPrompts();
                    updateStatistics();
                    showToast('Category deleted', 'success');
                }
            );
        });
    }

    // Update keys for descendant categories and prompts when a category is renamed
    function updateDescendantKeys(oldKey, newKey, newDisplay) {
        // Update the target li
        const li = document.querySelector(`#categoryList li[data-category="${oldKey}"]`);
        if (li) {
            li.dataset.category = newKey;
            li.dataset.name = newDisplay;
            const nameSpan = li.querySelector('.cat-name');
            if (nameSpan) nameSpan.textContent = newDisplay;
        }

        // Update descendant lis
        const allLis = Array.from(document.querySelectorAll('#categoryList li'));
        allLis.forEach(item => {
            const key = item.dataset.category;
            if (!key) return;
            if (key === oldKey) return;
            if (key.startsWith(oldKey + '/')) {
                const rest = key.slice(oldKey.length + 1);
                const newChildKey = newKey + '/' + rest;
                // update option value/text
                const select = document.getElementById('promptCategory');
                const opt = select.querySelector(`option[value="${key}"]`);
                const childDisplay = item.dataset.name || rest;
                if (opt) {
                    opt.value = newChildKey;
                    opt.textContent = newDisplay + ' / ' + childDisplay;
                }
                item.dataset.category = newChildKey;
            }
        });

        // Update select option for the renamed category
        const select = document.getElementById('promptCategory');
        const option = select.querySelector(`option[value="${oldKey}"]`);
        if (option) {
            option.value = newKey;
            option.textContent = newDisplay;
        }

        // Update prompts assigned to this category or its descendants
        prompts.forEach(p => {
            if (p.category === oldKey) p.category = newKey;
            else if (p.category && p.category.startsWith(oldKey + '/')) {
                p.category = newKey + p.category.slice(oldKey.length);
            }
        });
    }

    // Delete category and any descendant categories; reassign prompts to 'other'
    function deleteCategoryAndDescendants(keyToDelete, liElement) {
        // Reassign prompts whose category equals or starts with the key
        prompts.forEach(p => {
            if (p.category === keyToDelete || (p.category && p.category.startsWith(keyToDelete + '/'))) {
                p.category = 'other';
            }
        });

        // Remove select options matching key or descendants
        const select = document.getElementById('promptCategory');
        Array.from(select.querySelectorAll('option')).forEach(opt => {
            if (opt.value === keyToDelete || (opt.value && opt.value.startsWith(keyToDelete + '/'))) {
                opt.remove();
            }
        });

        // Remove li and any nested children
        if (liElement) liElement.remove();
        else {
            // fallback: remove any matching lis
            document.querySelectorAll(`#categoryList li[data-category^="${keyToDelete}"]`).forEach(el => el.remove());
        }
    }

    function enhanceAllCategories() {
        document.querySelectorAll('#categoryList li').forEach(li => makeCategoryItem(li));
        // Update category count
        const totalCategories = document.getElementById('totalCategories');
        if (totalCategories) totalCategories.textContent = document.querySelectorAll('#categoryList li').length;
    }

    // Initialize enhanced category items
    enhanceAllCategories();

    // Add category button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            const newCategoryInput = document.getElementById('newCategory');
            const newCategory = newCategoryInput.value.trim();
            if (!newCategory) return;

            const key = newCategory.toLowerCase();
            const exists = Array.from(document.querySelectorAll('#categoryList li')).some(li => li.dataset.category === key);
            if (exists) {
                showToast('Category already exists', 'warning');
                return;
            }

            // Create new li element and insert before 'other'
            const li = document.createElement('li');
            li.dataset.category = key;
            li.dataset.name = newCategory;

            const categoryList = document.getElementById('categoryList');
            const otherItem = categoryList.querySelector('[data-category="other"]');
            categoryList.insertBefore(li, otherItem);

            // Add option to select
            const select = document.getElementById('promptCategory');
            const option = document.createElement('option');
            option.value = key;
            option.textContent = newCategory;
            select.insertBefore(option, select.lastElementChild);

            // Enhance new li
            makeCategoryItem(li);

            // Clear input
            newCategoryInput.value = '';
            showToast(`Category "${newCategory}" added!`, 'success');
            updateStatistics();
        });
    }
    
    // Add new prompt buttons
    const addPromptBtn = document.getElementById('addPromptBtn');
    if (addPromptBtn) {
        addPromptBtn.addEventListener('click', addNewPrompt);
    }
    
    const addFirstPromptBtn = document.getElementById('addFirstPromptBtn');
    if (addFirstPromptBtn) {
        addFirstPromptBtn.addEventListener('click', addNewPrompt);
    }
    
    // Form submission
    const promptForm = document.getElementById('promptForm');
    if (promptForm) {
        promptForm.addEventListener('submit', savePrompt);
    }
    
    // Character count for prompt text
    const promptText = document.getElementById('promptText');
    if (promptText) {
        promptText.addEventListener('input', updateCharCount);
    }
    
    // Image upload handlers
    document.querySelectorAll('.image-input').forEach(input => {
        input.addEventListener('change', function() {
            handleImageUpload(this);
        });
    });
    
    // Image URL handler
    const addImageUrlBtn = document.getElementById('addImageUrlBtn');
    if (addImageUrlBtn) {
        addImageUrlBtn.addEventListener('click', function() {
            const urlInput = document.getElementById('inputImageUrl');
            const url = urlInput.value.trim();
            
            if (!url) {
                showToast('Please enter an image URL', 'warning');
                return;
            }
            
            loadImageFromUrl(url, 'input');
            urlInput.value = '';
        });
    }
    
    // Allow Enter key in URL input for input reference
    const inputImageUrl = document.getElementById('inputImageUrl');
    if (inputImageUrl) {
        inputImageUrl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('addImageUrlBtn').click();
            }
        });
    }
    
    // Result Image URL handler
    const addResultImageUrlBtn = document.getElementById('addResultImageUrlBtn');
    if (addResultImageUrlBtn) {
        addResultImageUrlBtn.addEventListener('click', function() {
            const urlInput = document.getElementById('resultImageUrl');
            const url = urlInput.value.trim();
            
            if (!url) {
                showToast('Please enter an image URL', 'warning');
                return;
            }
            
            loadImageFromUrl(url, 'result');
            urlInput.value = '';
        });
    }
    
    // Allow Enter key in URL input for result reference
    const resultImageUrl = document.getElementById('resultImageUrl');
    if (resultImageUrl) {
        resultImageUrl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('addResultImageUrlBtn').click();
            }
        });
    }
    
    // Delegate events for prompt card buttons
    document.addEventListener('click', function(e) {
        // Favorite button
        if (e.target.closest('.action-btn.favorite')) {
            const button = e.target.closest('.action-btn.favorite');
            const promptId = button.dataset.id;
            if (promptId) {
                toggleFavorite(promptId);
            }
        }
        
        // Copy button
        if (e.target.closest('.action-btn.copy')) {
            const button = e.target.closest('.action-btn.copy');
            const promptId = button.dataset.id;
            if (promptId) {
                copyPrompt(promptId);
            }
        }
        
        // Edit button
        if (e.target.closest('.action-btn.edit')) {
            const button = e.target.closest('.action-btn.edit');
            const promptId = button.dataset.id;
            if (promptId) {
                editPrompt(promptId);
            }
        }
        
        // Delete button
        if (e.target.closest('.action-btn.delete')) {
            const button = e.target.closest('.action-btn.delete');
            const promptId = button.dataset.id;
            if (promptId) {
                deletePrompt(promptId);
            }
        }
        
        // Image thumbnail click
        if (e.target.classList.contains('image-thumb')) {
            const imgSrc = e.target.src;
            const altText = e.target.alt;
            showImagePreview(imgSrc, altText);
        }
        
        // Suggestion item click
        if (e.target.classList.contains('suggestion-item')) {
            const suggestionText = e.target.textContent.replace('Tag: ', '');
            document.getElementById('searchInput').value = suggestionText;
            document.getElementById('searchSuggestions').classList.remove('active');
            // Trigger search
            const searchEvent = new Event('input', { bubbles: true });
            document.getElementById('searchInput').dispatchEvent(searchEvent);
        }
    });
    
    // Import/Export buttons
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', handleFileImport);
    }
    
    // Confirm modal actions
    const confirmCancel = document.getElementById('confirmCancel');
    if (confirmCancel) {
        confirmCancel.addEventListener('click', closeAllModals);
    }
    
    const confirmOk = document.getElementById('confirmOk');
    if (confirmOk) {
        confirmOk.addEventListener('click', function() {
            if (pendingConfirmAction) {
                pendingConfirmAction();
                pendingConfirmAction = null;
            }
            closeAllModals();
        });
    }
    
    // Search functionality with suggestions - OPTIMIZED WITH DEBOUNCING
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            // Clear previous timeout
            if (searchTimeoutId) {
                clearTimeout(searchTimeoutId);
            }
            
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Debounce search by 300ms to avoid excessive DOM manipulation
            searchTimeoutId = setTimeout(() => {
                // Generate suggestions
                generateSearchSuggestions(searchTerm);
                
                // Use cached data if available
                if (searchCache[searchTerm] !== undefined) {
                    applySearchResults(searchCache[searchTerm], searchTerm);
                } else {
                    const promptCards = document.querySelectorAll('.prompt-card');
                    const results = [];
                    
                    promptCards.forEach(card => {
                        const title = card.querySelector('.prompt-title-text').textContent.toLowerCase();
                        const text = card.querySelector('.prompt-text').textContent.toLowerCase();
                        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
                        
                        const matches = title.includes(searchTerm) || 
                                       text.includes(searchTerm) || 
                                       tags.some(tag => tag.includes(searchTerm));
                        
                        if (matches) {
                            results.push(card.dataset.id);
                        }
                    });
                    
                    // Cache the result
                    searchCache[searchTerm] = results;
                    applySearchResults(results, searchTerm);
                }
            }, 300);
        });
    }
    
    // Helper function to apply search results
    function applySearchResults(matchingIds, searchTerm) {
        const promptCards = document.querySelectorAll('.prompt-card');
        promptCards.forEach(card => {
            const matches = matchingIds.includes(card.dataset.id);
            card.style.display = matches ? 'block' : 'none';
        });
        
        // Show/hide empty state
        const visibleCards = Array.from(promptCards).filter(card => card.style.display !== 'none');
        const emptyState = document.getElementById('emptyState');
        if (visibleCards.length === 0 && searchTerm) {
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No matching prompts</h3>
                <p>No prompts found for "${escapeHtml(searchTerm)}"</p>
            `;
            emptyState.style.display = 'block';
        } else if (visibleCards.length === 0) {
            updateEmptyState();
        } else {
            emptyState.style.display = 'none';
        }
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        // Ctrl+N to add new prompt
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            addNewPrompt();
        }
        
        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        
        // Ctrl+Shift+Z or Ctrl+Y for redo
        if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
        
        // Ctrl+S to save (no-op since auto-save exists, but good for UX)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showToast('Auto-saving is enabled!', 'info');
        }
        
        // Arrow keys in search dropdown for navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions && suggestions.classList.contains('active')) {
                e.preventDefault();
                navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
            }
        }
        
        // Enter to select highlighted suggestion
        if (e.key === 'Enter') {
            const suggestions = document.getElementById('searchSuggestions');
            const highlighted = suggestions?.querySelector('.suggestion-item.highlighted');
            if (highlighted) {
                e.preventDefault();
                highlighted.click();
            }
        }
    });
    
    // Make category "All" active by default
    const allCategory = document.querySelector('.category-list li[data-category="all"]');
    if (allCategory) {
        allCategory.classList.add('active');
    }
    
    console.log('Event listeners setup complete');
}

// ============================================
// PERFORMANCE MONITORING & OPTIMIZATION
// ============================================

/**
 * Performance metrics tracking
 * Monitors app performance and logs metrics
 */
const performanceMetrics = {
    startTime: Date.now(),
    lastSearch: 0,
    lastRender: 0,
    renderCount: 0,
    
    /**
     * Log performance metric
     */
    log: function(label) {
        const now = Date.now();
        const duration = now - this.startTime;
        console.log(`[Performance] ${label}: ${duration}ms`);
        return duration;
    },
    
    /**
     * Measure time taken for operation
     */
    measure: function(label, fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
        return result;
    },
    
    /**
     * Get memory usage (if available)
     */
    getMemory: function() {
        if (performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    },
    
    /**
     * Report overall stats
     */
    report: function() {
        console.log('=== Performance Report ===');
        console.log(`Prompts: ${prompts.length}`);
        console.log(`Search Cache Size: ${Object.keys(searchCache).length}`);
        console.log(`Favorites: ${favorites.length}`);
        console.log(`Templates: ${templates.length}`);
        const memory = this.getMemory();
        if (memory) {
            console.log(`Memory - Used: ${memory.used}, Limit: ${memory.limit}`);
        }
        console.log('=========================');
    }
};

/**
 * Cache management for search results
 */
const cacheManager = {
    /**
     * Clear search cache to free memory
     */
    clearSearchCache: function() {
        const oldSize = Object.keys(searchCache).length;
        searchCache = {};
        console.log(`[Cache] Cleared ${oldSize} search results`);
    },
    
    /**
     * Clear image cache
     */
    clearImageCache: function() {
        const oldSize = imageCache.size;
        imageCache.clear();
        console.log(`[Cache] Cleared ${oldSize} image entries`);
    },
    
    /**
     * Clear all caches
     */
    clearAll: function() {
        this.clearSearchCache();
        this.clearImageCache();
        console.log('[Cache] All caches cleared');
    },
    
    /**
     * Get cache statistics
     */
    getStats: function() {
        return {
            searchCache: Object.keys(searchCache).length,
            imageCache: imageCache.size,
            undoStack: undoStack.length,
            redoStack: redoStack.length
        };
    }
};

/**
 * Optimize large lists with virtual scrolling (future enhancement)
 * @param {HTMLElement} container - Container for items
 * @param {Array} items - Items to display
 * @param {Function} renderItem - Function to render single item
 * @param {number} itemHeight - Height of each item
 */
function virtualScroll(container, items, renderItem, itemHeight) {
    const containerHeight = container.clientHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
    
    let scrollTop = container.scrollTop;
    let startIndex = Math.floor(scrollTop / itemHeight);
    
    const visibleItems = items.slice(startIndex, startIndex + visibleCount);
    
    // Render only visible items
    container.innerHTML = visibleItems.map((item, idx) => 
        renderItem(item, startIndex + idx)
    ).join('');
}

/**
 * Compress data for storage (future enhancement)
 */
function compressData(data) {
    // Future: Use LZ compression library
    // For now, just return JSON
    return JSON.stringify(data);
}

/**
 * Monitor operation performance
 */
function monitorPerformance(label, fn) {
    const start = performance.now();
    try {
        const result = fn();
        const duration = performance.now() - start;
        if (duration > 100) {
            console.warn(`⚠️ [Slow] ${label} took ${duration.toFixed(2)}ms`);
        }
        return result;
    } catch (error) {
        console.error(`❌ [Error] ${label}:`, error);
        throw error;
    }
}

/**
 * Lazy load images with intersection observer (future)
 */
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => 
            imageObserver.observe(img)
        );
    }
}

/**
 * Batch process operations
 */
function batchOperation(items, batchSize, operation) {
    return new Promise((resolve) => {
        let index = 0;
        
        function processBatch() {
            const batch = items.slice(index, index + batchSize);
            batch.forEach(operation);
            index += batchSize;
            
            if (index < items.length) {
                // Yield to main thread
                setTimeout(processBatch, 0);
            } else {
                resolve();
            }
        }
        
        processBatch();
    });
}