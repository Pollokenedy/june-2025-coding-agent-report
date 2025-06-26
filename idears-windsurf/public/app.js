document.addEventListener('DOMContentLoaded', () => {
    const ideaForm = document.getElementById('ideaForm');
    const ideasContainer = document.getElementById('ideas');

    // Load ideas when page loads
    loadIdeas();

    // Add new idea
    ideaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;

        try {
            const response = await fetch('/ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });

            if (response.ok) {
                ideaForm.reset();
                loadIdeas();
            } else {
                throw new Error('Failed to add idea');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    // Load ideas from server
    async function loadIdeas() {
        try {
            const response = await fetch('/ideas');
            const ideas = await response.json();
            displayIdeas(ideas);
        } catch (error) {
            console.error('Error loading ideas:', error);
        }
    }

    // Display ideas in the UI
    function displayIdeas(ideas) {
        ideasContainer.innerHTML = '';
        ideas.forEach(idea => {
            const ideaElement = createIdeaElement(idea);
            ideasContainer.appendChild(ideaElement);
        });
    }

    // Create DOM element for an idea
    function createIdeaElement(idea) {
        const ideaElement = document.createElement('div');
        ideaElement.className = 'idea-item';
        
        ideaElement.innerHTML = `
            <div class="votes">${idea.votes}</div>
            <div class="idea-content">
                <h3>${idea.title}</h3>
                <p>${idea.description}</p>
                <div class="notes">
                    ${idea.notes.map(note => `
                        <div class="note-item">
                            <p>${note.content}</p>
                            <small>${new Date(note.timestamp).toLocaleString()}</small>
                            ${note.attachment ? `
                                <a href="/uploads/${note.attachment.filename}" class="attachment">${note.attachment.originalname}</a>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <button onclick="vote('${idea._id}')">Vote</button>
                <button onclick="addNote('${idea._id}')">Add Note</button>
            </div>
        `;

        return ideaElement;
    }

    // Vote function
    window.vote = async (ideaId) => {
        try {
            const response = await fetch(`/ideas/${ideaId}/vote`, {
                method: 'POST',
            });
            if (response.ok) {
                loadIdeas();
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    // Add note function
    window.addNote = async (ideaId) => {
        const noteContent = prompt('Enter your note:');
        if (!noteContent) return;

        try {
            const formData = new FormData();
            formData.append('content', noteContent);

            const response = await fetch(`/ideas/${ideaId}/notes`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                loadIdeas();
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };
});
