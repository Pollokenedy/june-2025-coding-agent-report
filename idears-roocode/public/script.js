document.addEventListener('DOMContentLoaded', () => {
    const newIdeaForm = document.getElementById('new-idea-form');
    const ideaTextarea = document.getElementById('idea-text');
    const ideaAttachmentsInput = document.getElementById('idea-attachments');
    const ideasUl = document.getElementById('ideas-ul');

    const notesModal = document.getElementById('notes-modal');
    const closeButton = document.querySelector('.close-button');
    const addNoteForm = document.getElementById('add-note-form');
    const modalIdeaText = document.getElementById('modal-idea-text');
    const modalIdeaIdInput = document.getElementById('modal-idea-id');
    const noteTextarea = document.getElementById('note-text');
    const modalNotesList = document.getElementById('modal-notes-list');

    const API_URL = '/api/ideas';

    // Fetch and display ideas
    async function fetchIdeas() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const ideas = await response.json();
            renderIdeas(ideas);
        } catch (error) {
            console.error('Error fetching ideas:', error);
            ideasUl.innerHTML = '<li>Error loading ideas. Please try again later.</li>';
        }
    }

    // Render ideas to the page
    function renderIdeas(ideas) {
        ideasUl.innerHTML = ''; // Clear existing ideas
        if (ideas.length === 0) {
            ideasUl.innerHTML = '<li>No ideas yet. Add one!</li>';
            return;
        }
        ideas.forEach(idea => {
            const li = document.createElement('li');
            li.dataset.id = idea.id;

            const ideaContent = document.createElement('div');
            ideaContent.classList.add('idea-content');

            const ideaP = document.createElement('p');
            ideaP.textContent = idea.text;
            ideaContent.appendChild(ideaP);

            const metaDiv = document.createElement('div');
            metaDiv.classList.add('idea-meta');
            const createdAt = new Date(idea.createdAt).toLocaleString();
            metaDiv.innerHTML = `<p>Created: ${createdAt}</p>`;

            if (idea.attachments && idea.attachments.length > 0) {
                const attachmentsTitle = document.createElement('p');
                attachmentsTitle.textContent = 'Attachments:';
                metaDiv.appendChild(attachmentsTitle);
                const attachmentsUl = document.createElement('ul');
                attachmentsUl.classList.add('attachments-list');
                idea.attachments.forEach(att => {
                    const attLi = document.createElement('li');
                    const attLink = document.createElement('a');
                    // Assuming uploads are served from /data/uploads relative to server root
                    // The server.js serves 'data' as a static dir, but it's better to have a specific route for downloads
                    // For now, let's assume a direct link might work if 'data' is accessible or we create a download route.
                    // A proper implementation would be: `/api/ideas/attachments/${att.filename}`
                    attLink.href = `/data/uploads/${att.filename}`; // This needs to align with how server serves files
                    attLink.textContent = att.originalname;
                    attLink.target = '_blank'; // Open in new tab
                    attLi.appendChild(attLink);
                    attachmentsUl.appendChild(attLi);
                });
                metaDiv.appendChild(attachmentsUl);
            }


            ideaContent.appendChild(metaDiv);


            const ideaActions = document.createElement('div');
            ideaActions.classList.add('idea-actions');

            const votesSpan = document.createElement('span');
            votesSpan.classList.add('votes-count');
            votesSpan.textContent = `${idea.votes || 0} votes`;

            const voteButton = document.createElement('button');
            voteButton.textContent = 'Vote Up';
            voteButton.classList.add('vote-button');
            voteButton.addEventListener('click', () => voteForIdea(idea.id));

            const notesButton = document.createElement('button');
            notesButton.textContent = 'Notes';
            notesButton.classList.add('notes-button');
            notesButton.addEventListener('click', () => openNotesModal(idea));

            ideaActions.appendChild(votesSpan);
            ideaActions.appendChild(voteButton);
            ideaActions.appendChild(notesButton);

            li.appendChild(ideaContent);
            li.appendChild(ideaActions);
            ideasUl.appendChild(li);
        });
    }

    // Add a new idea
    newIdeaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = ideaTextarea.value.trim();
        const files = ideaAttachmentsInput.files;

        if (!text) {
            alert('Please enter your idea.');
            return;
        }

        const formData = new FormData();
        formData.append('text', text);
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('attachments', files[i]);
            }
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData // FormData handles multipart/form-data
                // 'Content-Type' header is set automatically by FormData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // const newIdea = await response.json(); // Not strictly needed if we refetch
            ideaTextarea.value = '';
            ideaAttachmentsInput.value = ''; // Clear file input
            fetchIdeas(); // Refresh the list
        } catch (error) {
            console.error('Error adding idea:', error);
            alert(`Error adding idea: ${error.message}`);
        }
    });

    // Vote for an idea
    async function voteForIdea(id) {
        try {
            const response = await fetch(`${API_URL}/${id}/vote`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // const updatedIdea = await response.json(); // Not strictly needed if we refetch
            fetchIdeas(); // Refresh the list to show updated votes and order
        } catch (error) {
            console.error('Error voting for idea:', error);
            alert(`Error voting: ${error.message}`);
        }
    }

    // Open notes modal
    function openNotesModal(idea) {
        modalIdeaText.textContent = `Idea: "${idea.text}"`;
        modalIdeaIdInput.value = idea.id;
        renderNotes(idea.notes || []);
        notesModal.style.display = 'block';
    }

    // Close notes modal
    closeButton.onclick = function() {
        notesModal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == notesModal) {
            notesModal.style.display = 'none';
        }
    }

    // Render notes in modal
    function renderNotes(notes) {
        modalNotesList.innerHTML = '';
        if (notes.length === 0) {
            modalNotesList.innerHTML = '<li>No notes for this idea yet.</li>';
            return;
        }
        notes.forEach(note => {
            const li = document.createElement('li');
            const noteP = document.createElement('p');
            noteP.textContent = note.text;
            const noteMeta = document.createElement('small');
            noteMeta.textContent = `Added: ${new Date(note.createdAt).toLocaleString()}`;
            li.appendChild(noteP);
            li.appendChild(noteMeta);
            modalNotesList.appendChild(li);
        });
    }

    // Add a note to an idea
    addNoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ideaId = modalIdeaIdInput.value;
        const noteContent = noteTextarea.value.trim();

        if (!noteContent) {
            alert('Please enter your note.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${ideaId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ noteText: noteContent }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            // const newNote = await response.json(); // Not strictly needed if we refetch
            noteTextarea.value = '';
            fetchIdeas(); // Refresh all ideas to get the updated one
            notesModal.style.display = 'none'; // Close modal after adding
            // Re-open modal if needed, or just update the specific idea's notes display
            // For simplicity, we refetch all and the user can reopen if they want to see the new note immediately in modal.
            // A more sophisticated approach would update the modal directly.
        } catch (error) {
            console.error('Error adding note:', error);
            alert(`Error adding note: ${error.message}`);
        }
    });


    // Initial fetch of ideas
    fetchIdeas();
});