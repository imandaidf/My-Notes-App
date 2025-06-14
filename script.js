// Ensure the DOM is fully loaded before running the script
window.onload = function() {
    const noteInputArea = document.getElementById('noteInputArea');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const notesContainer = document.getElementById('notesContainer');
    const noNotesMessage = document.getElementById('noNotesMessage');
    const insertImageBtn = document.getElementById('insertImageBtn');
    const imageInput = document.getElementById('imageInput');
    const searchInput = document.getElementById('searchInput');

    // When user clicks the image icon, open file dialog
    insertImageBtn.addEventListener('click', function() {
        imageInput.click();
    });

    // When user selects an image file
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                insertImageIntoContentEditable(e.target.result);
            };
            reader.readAsDataURL(file);
        }
        // Reset the input so the same image can be selected again if desired
        imageInput.value = '';
    });

    // Key for storing notes in localStorage
    const NOTES_STORAGE_KEY = 'myNotesApp_notes';

    // --- Timestamp utility ---
    function getFormattedTimestamp(date = new Date()) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        let hour = date.getHours();
        const minute = date.getMinutes().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;

        return `${dayName}, ${day} ${month} ${year}, ${hour}.${minute}.${ms} ${ampm}`;
    }

    /**
     * Loads notes from localStorage.
     * @returns {Array<string>} An array of HTML strings representing notes.
     */
    function loadNotes() {
        try {
            const notesJson = localStorage.getItem(NOTES_STORAGE_KEY);
            return notesJson ? JSON.parse(notesJson) : [];
        } catch (e) {
            console.error("Error loading notes from localStorage:", e);
            return [];
        }
    }

    /**
     * Saves notes to localStorage.
     * @param {Array<string>} notes An array of HTML strings to save.
     */
    function saveNotes(notes) {
        try {
            localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error("Error saving notes to localStorage:", e);
        }
    }

    /**
     * Renders all notes from the loaded notes array into the DOM.
     */
    function renderNotes(searchTerm = '') {
        const notes = loadNotes();
        notesContainer.innerHTML = ''; // Clear existing notes

        // Filter notes if searchTerm is provided
        const filteredNotes = notes.filter(noteHtml =>
            noteHtml.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Find all matches, but keep their original index for delete
        const filteredNotesWithIndex = notes
        .map((noteHtml, idx) => ({ noteHtml, idx }))
        .filter(({ noteHtml }) => noteHtml.toLowerCase().includes(searchTerm.toLowerCase()));


        if (filteredNotesWithIndex.length === 0) {
            noNotesMessage.classList.remove('hidden');
        } else {
            noNotesMessage.classList.add('hidden');
            filteredNotesWithIndex.forEach(({ noteHtml, idx }) => {
                const noteDiv = document.createElement('div');
                noteDiv.classList.add('note-item');
                noteDiv.innerHTML = noteHtml;

                // Add a delete button to each note
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.classList.add(
                    'mt-4', 'ml-auto', 'block', 'bg-red-500', 'hover:bg-red-600',
                    'text-white', 'font-bold', 'py-2', 'px-4', 'rounded-md',
                    'transition', 'duration-200', 'ease-in-out', 'focus:outline-none',
                    'focus:ring-2', 'focus:ring-red-400', 'focus:ring-opacity-75'
                );
                deleteBtn.onclick = () => deleteNote(idx);
                noteDiv.appendChild(deleteBtn);

                notesContainer.appendChild(noteDiv);
            });
        }

    }

    searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    /**
     * Deletes a note at a specific index.
     * @param {number} index The index of the note to delete.
     */
    function deleteNote(index) {
        // Show confirmation dialog before deleting
        if (confirm("Are you sure you want to delete this note?")) {
            let notes = loadNotes();
            if (index > -1 && index < notes.length) {
                notes.splice(index, 1); // Remove the note
                saveNotes(notes); // Save updated notes
                renderNotes(); // Re-render the notes list
            }
        }
    }

    /**
     * Handles adding a new note to the list.
     */
    addNoteBtn.addEventListener('click', () => {
        const noteContent = noteInputArea.innerHTML.trim(); // Get HTML content

        if (noteContent) {
            const timestamp = getFormattedTimestamp();
            // Add timestamp to the note content (displayed at the bottom)
            const noteWithTimestamp = `
                <div>${noteContent}</div>
                <div class="text-xs text-gray-500 mt-2" style="font-size:0.85em; color:#6b7280; margin-top:0.5em;">
                    <span>${timestamp}</span>
                </div>
            `;
            const notes = loadNotes();
            notes.unshift(noteWithTimestamp); // Add new note to the beginning
            saveNotes(notes);
            noteInputArea.innerHTML = ''; // Clear the input area
            renderNotes(); // Re-render notes
        } else {
            // Instead of alert, provide visual feedback
            noteInputArea.style.borderColor = '#ef4444'; // Red border
            noteInputArea.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)'; // Red shadow
            setTimeout(() => {
                noteInputArea.style.borderColor = '#d1d5db'; // Reset border
                noteInputArea.style.boxShadow = 'none'; // Reset shadow
            }, 1500);
        }
    });

    /**
     * Inserts an image into the contenteditable div at the current cursor position.
     * @param {string} dataUrl The base64 data URL of the image.
     */
    function insertImageIntoContentEditable(dataUrl) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Note Image';
        img.style.maxWidth = '100%'; // Ensure image fits
        img.style.height = 'auto'; // Maintain aspect ratio
        img.style.display = 'block'; // Ensure it's on its own line
        img.style.marginTop = '1rem'; // Add some spacing

        // Get the current selection range
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents(); // Delete any selected content
            range.insertNode(img); // Insert the image
            range.setStartAfter(img); // Move cursor after the image
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // If no selection, just append the image
            noteInputArea.appendChild(img);
        }

        // Add a line break after the image for better typing experience
        noteInputArea.appendChild(document.createElement('br'));
    }

    /**
     * Handles image files (from drag/drop or paste) and inserts them.
     * @param {File} file The image file object.
     */
    function handleImageFile(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                insertImageIntoContentEditable(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            console.warn("Non-image file dropped/pasted:", file.type);
        }
    }

    // --- Drag and Drop functionality ---
    noteInputArea.addEventListener('dragover', (e) => {
        e.preventDefault(); // Prevent default to allow drop
        e.stopPropagation();
        noteInputArea.classList.add('border-blue-500', 'ring-2', 'ring-blue-300'); // Visual feedback
    });

    noteInputArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        noteInputArea.classList.remove('border-blue-500', 'ring-2', 'ring-blue-300'); // Remove visual feedback
    });

    noteInputArea.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default browser behavior (e.g., opening image)
        e.stopPropagation();
        noteInputArea.classList.remove('border-blue-500', 'ring-2', 'ring-blue-300'); // Remove visual feedback

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFile(files[0]);
        }
    });

    // --- Paste functionality ---
    noteInputArea.addEventListener('paste', (e) => {
        // Prevent default paste behavior to handle it manually
        e.preventDefault();
        e.stopPropagation();

        const clipboardData = e.clipboardData;
        let imageFound = false;

        // Check for image files in clipboard
        for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    handleImageFile(file);
                    imageFound = true;
                    break; // Only handle the first image found
                }
            }
        }

        // If no image was found, paste text content
        if (!imageFound) {
            const text = clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    });

    // Initial render of notes when the page loads
    renderNotes();
};
