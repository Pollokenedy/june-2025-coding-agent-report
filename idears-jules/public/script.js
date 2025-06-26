document.addEventListener('DOMContentLoaded', () => {
    const newIdeaForm = document.getElementById('new-idea-form');
    const ideaTextarea = document.getElementById('idea-text');
    const ideasContainer = document.getElementById('ideas-container');

    const API_URL = '/ideas';

    // Function to fetch and display ideas
    async function fetchAndDisplayIdeas() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const ideas = await response.json();
            renderIdeas(ideas);
        } catch (error) {
            console.error('Error fetching ideas:', error);
            ideasContainer.innerHTML = '<p>Error loading ideas. Please try again later.</p>';
        }
    }

    // Function to render ideas to the DOM
    function renderIdeas(ideas) {
        ideasContainer.innerHTML = ''; // Clear existing ideas

        if (ideas.length === 0) {
            ideasContainer.innerHTML = '<p>No ideas yet. Be the first to add one!</p>';
            return;
        }

        ideas.forEach(idea => {
            const ideaElement = document.createElement('div');
            ideaElement.classList.add('idea');
            ideaElement.setAttribute('data-id', idea.id);

            const createdDate = new Date(idea.createdAt).toLocaleString();
            const updatedDate = new Date(idea.updatedAt).toLocaleString();

            ideaElement.innerHTML = `
                <h3>${escapeHTML(idea.text)}</h3>
                <p class="meta">Votes: <span class="votes-count">${idea.votes}</span></p>
                <p class="meta">Created: ${createdDate}</p>
                <p class="meta">Updated: ${updatedDate}</p>

                <div class="actions">
                    <button class="vote-btn">Vote Up</button>

                    <h4>Notes:</h4>
                    <div class="notes-section">
                        ${renderNotes(idea.notes)}
                    </div>
                    <form class="add-note-form">
                        <input type="text" class="note-text" placeholder="Add a note" required>
                        <button type="submit">Add Note</button>
                    </form>

                    <h4>Attachments:</h4>
                    <div class="attachments-section">
                        ${renderAttachments(idea.attachments)}
                    </div>
                    <form class="add-attachment-form" enctype="multipart/form-data">
                        <input type="file" class="attachment-file" required>
                        <button type="submit">Upload Attachment</button>
                    </form>
                </div>
            `;

            // Event listeners for actions
            ideaElement.querySelector('.vote-btn').addEventListener('click', () => voteForIdea(idea.id));
            ideaElement.querySelector('.add-note-form').addEventListener('submit', (e) => addNoteToIdea(e, idea.id));
            ideaElement.querySelector('.add-attachment-form').addEventListener('submit', (e) => addAttachmentToIdea(e, idea.id));

            ideasContainer.appendChild(ideaElement);
        });
    }

    function renderNotes(notes) {
        if (!notes || notes.length === 0) return '<p>No notes yet.</p>';
        return `<ul>${notes.map(note => `<li>${escapeHTML(note)}</li>`).join('')}</ul>`;
    }

    function renderAttachments(attachments) {
        if (!attachments || attachments.length === 0) return '<p>No attachments yet.</p>';
        return `<ul>${attachments.map(att => `<li><a href="/uploads/${att.filepath.split('/').pop()}" target="_blank">${escapeHTML(att.filename)}</a> (${(att.size / 1024).toFixed(2)} KB)</li>`).join('')}</ul>`;
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return str.toString().replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // Handle new idea form submission
    newIdeaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = ideaTextarea.value.trim();
        if (!text) return;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            ideaTextarea.value = ''; // Clear textarea
            fetchAndDisplayIdeas(); // Refresh list
        } catch (error) {
            console.error('Error adding idea:', error);
            alert('Failed to add idea.');
        }
    });

    // Function to vote for an idea
    async function voteForIdea(ideaId) {
        try {
            const response = await fetch(`${API_URL}/${ideaId}/vote`, { method: 'POST' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchAndDisplayIdeas(); // Refresh list
        } catch (error) {
            console.error('Error voting for idea:', error);
            alert('Failed to vote for idea.');
        }
    }

    // Function to add a note to an idea
    async function addNoteToIdea(event, ideaId) {
        event.preventDefault();
        const noteText = event.target.querySelector('.note-text').value.trim();
        if (!noteText) return;

        try {
            const response = await fetch(`${API_URL}/${ideaId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteText }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fetchAndDisplayIdeas(); // Refresh list
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Failed to add note.');
        }
    }

    // Function to add an attachment to an idea
    async function addAttachmentToIdea(event, ideaId) {
        event.preventDefault();
        const fileInput = event.target.querySelector('.attachment-file');
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to upload.');
            return;
        }
        const formData = new FormData();
        formData.append('attachmentFile', fileInput.files[0]);

        try {
            const response = await fetch(`${API_URL}/${ideaId}/attachments`, {
                method: 'POST',
                body: formData, // No 'Content-Type' header for FormData, browser sets it
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error uploading file.' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error}`);
            }
            fetchAndDisplayIdeas(); // Refresh list
        } catch (error) {
            console.error('Error uploading attachment:', error);
            alert(`Failed to upload attachment: ${error.message}`);
        }
    }

    // Initial fetch of ideas
    fetchAndDisplayIdeas();
});
