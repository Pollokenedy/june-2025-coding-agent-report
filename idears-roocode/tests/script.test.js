/**
 * @jest-environment jsdom
 */

global.fetch = jest.fn();

const fs = require('fs');
const path = require('path');

// Load the HTML file into JSDOM
const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');

// Mock Date.now for consistent IDs and timestamps in tests
const mockDateNow = jest.fn();
Date.now = mockDateNow;


describe('Frontend JavaScript (script.js)', () => {
    let mockIdeasData;

    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        // Reset mocks for each test
        fetch.mockClear();
        mockDateNow.mockClear();

        // Default mock ideas data
        mockIdeasData = [
            { id: '1', text: 'Test Idea 1', votes: 2, createdAt: 1678886400000, notes: [], attachments: [] },
            { id: '2', text: 'Test Idea 2', votes: 5, createdAt: 1678887400000, notes: [{id: 'n1', text:'note1', createdAt: 1678887500000}], attachments: [{filename: 'file1.txt', originalname: 'File One.txt'}] },
        ];

        // Mock successful fetch for initial load
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockIdeasData,
        });

        // Load the script after the DOM is set up and fetch is mocked
        // This ensures DOMContentLoaded fires and initial fetchIdeas() is called
        require('../public/script.js');
    });

    test('should fetch and display ideas on load', async () => {
        // Wait for the DOM to update after script execution and fetch
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow microtasks to complete

        const ideasUl = document.getElementById('ideas-ul');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/ideas');
        expect(ideasUl.children.length).toBe(2);
        expect(ideasUl.children[0].querySelector('p').textContent).toBe('Test Idea 1');
        expect(ideasUl.children[1].querySelector('.idea-content p').textContent).toBe('Test Idea 2');
        expect(ideasUl.children[1].querySelector('.votes-count').textContent).toBe('5 votes');
        expect(ideasUl.children[1].querySelector('.attachments-list li a').textContent).toBe('File One.txt');
    });

    test('should display "No ideas yet" if no ideas are fetched', async () => {
        fetch.mockReset(); // Reset previous mock
        fetch.mockResolvedValueOnce({ // New mock for this specific test case
            ok: true,
            json: async () => [],
        });

        // Re-trigger fetchIdeas or simulate it
        document.dispatchEvent(new Event('DOMContentLoaded')); // Re-trigger if script re-runs
        // Or directly call the function if it's exposed (it's not globally in this setup)
        // For simplicity, we assume the initial fetch in beforeEach is what we test against
        // or we'd need to re-require the script or expose fetchIdeas.
        // Let's clear the list and call the render function directly for this specific scenario.
        const ideasUl = document.getElementById('ideas-ul');
        ideasUl.innerHTML = ''; // Clear it
        const scriptModule = require('../public/script.js'); // This might re-run the script or give cached module
        // Manually call render if possible, or re-evaluate how to test this scenario.
        // The current script structure runs fetchIdeas on DOMContentLoaded.
        // To test empty, we'd need the initial fetch to return empty.

        // Let's adjust: the beforeEach already sets up an initial fetch.
        // We need to override that initial fetch for this specific test.
        // This is tricky because the script runs immediately.
        // A better way would be to have fetchIdeas as an exported function.

        // Given the current structure, let's assume the initial fetch (mocked in beforeEach)
        // is what we are testing. If that fetch returned [], this would be the state.
        // So, we'll modify the mockIdeasData for this test *before* the script is required.

        // This test needs a different setup for the initial fetch.
        // We'll clear the DOM and re-require the script with a new fetch mock.
        document.documentElement.innerHTML = html.toString();
        fetch.mockReset();
        fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
        require('../public/script.js'); // Re-require to trigger DOMContentLoaded with new mock

        await new Promise(resolve => setTimeout(resolve, 0));

        const ideasUlAfterEmpty = document.getElementById('ideas-ul');
        expect(ideasUlAfterEmpty.children.length).toBe(1);
        expect(ideasUlAfterEmpty.children[0].textContent).toBe('No ideas yet. Add one!');
    });


    test('should add a new idea when form is submitted', async () => {
        const ideaTextarea = document.getElementById('idea-text');
        const newIdeaForm = document.getElementById('new-idea-form');

        mockDateNow.mockReturnValue(1678888000000); // For ID and createdAt
        const newIdeaText = 'A brilliant new test idea';
        ideaTextarea.value = newIdeaText;

        // Mock the POST request for adding an idea
        fetch.mockResolvedValueOnce({ // For the add idea POST
            ok: true,
            json: async () => ({
                id: Date.now().toString(), // Consistent ID
                text: newIdeaText,
                votes: 0,
                notes: [],
                attachments: [],
                createdAt: Date.now()
            }),
        });
        // Mock the subsequent GET request (fetchIdeas after adding)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                ...mockIdeasData,
                { id: '3', text: newIdeaText, votes: 0, createdAt: 1678888000000, notes: [], attachments: [] }
            ],
        });


        newIdeaForm.dispatchEvent(new Event('submit'));

        // Wait for async operations (fetch calls)
        await new Promise(resolve => setTimeout(resolve, 10)); // Increased timeout slightly

        expect(fetch).toHaveBeenCalledTimes(3); // Initial load, POST, refresh GET
        expect(fetch).toHaveBeenNthCalledWith(2, '/api/ideas', expect.objectContaining({ method: 'POST' }));

        const ideasUl = document.getElementById('ideas-ul');
        expect(ideasUl.children.length).toBe(3); // 2 initial + 1 new
        const newLi = Array.from(ideasUl.children).find(li => li.querySelector('p').textContent === newIdeaText);
        expect(newLi).toBeDefined();
        expect(ideaTextarea.value).toBe(''); // Form should be cleared
    });


    test('should vote for an idea when vote button is clicked', async () => {
        // Wait for initial ideas to render
        await new Promise(resolve => setTimeout(resolve, 0));

        const firstIdeaVoteButton = document.querySelector('#ideas-ul li .vote-button');
        const firstIdeaId = mockIdeasData[0].id;

        // Mock the POST request for voting
        fetch.mockResolvedValueOnce({ // For the vote POST
            ok: true,
            json: async () => ({ ...mockIdeasData[0], votes: mockIdeasData[0].votes + 1 }),
        });
        // Mock the subsequent GET request (fetchIdeas after voting)
        const updatedMockIdeasData = mockIdeasData.map(idea =>
            idea.id === firstIdeaId ? { ...idea, votes: idea.votes + 1 } : idea
        );
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => updatedMockIdeasData,
        });

        firstIdeaVoteButton.click();

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(fetch).toHaveBeenCalledTimes(3); // Initial, Vote POST, Refresh GET
        expect(fetch).toHaveBeenNthCalledWith(2, `/api/ideas/${firstIdeaId}/vote`, expect.objectContaining({ method: 'POST' }));

        const ideasUl = document.getElementById('ideas-ul');
        const votedIdeaLi = Array.from(ideasUl.children).find(li => li.dataset.id === firstIdeaId);
        expect(votedIdeaLi.querySelector('.votes-count').textContent).toBe(`${mockIdeasData[0].votes + 1} votes`);
    });

    test('should open notes modal and display notes when "Notes" button is clicked', async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initial render

        const ideaWithNotes = mockIdeasData[1]; // Second idea has a note
        const notesButton = document.querySelectorAll('#ideas-ul li .notes-button')[1]; // Second idea's note button

        notesButton.click();

        const notesModal = document.getElementById('notes-modal');
        const modalIdeaText = document.getElementById('modal-idea-text');
        const modalNotesList = document.getElementById('modal-notes-list');

        expect(notesModal.style.display).toBe('block');
        expect(modalIdeaText.textContent).toContain(ideaWithNotes.text);
        expect(modalNotesList.children.length).toBe(1);
        expect(modalNotesList.children[0].querySelector('p').textContent).toBe(ideaWithNotes.notes[0].text);
    });

    test('should add a note when "Add Note" form in modal is submitted', async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Initial render

        // Open modal for the first idea (which has no notes initially)
        const firstIdea = mockIdeasData[0];
        const notesButtonFirstIdea = document.querySelectorAll('#ideas-ul li .notes-button')[0];
        notesButtonFirstIdea.click();

        const noteTextarea = document.getElementById('note-text');
        const addNoteForm = document.getElementById('add-note-form');
        const newNoteContent = 'This is a new note from test.';
        noteTextarea.value = newNoteContent;

        mockDateNow.mockReturnValue(1678889000000); // For note ID and createdAt

        // Mock the POST for adding a note
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: Date.now().toString(), text: newNoteContent, createdAt: Date.now() }),
        });

        // Mock the subsequent GET (fetchIdeas)
        const updatedFirstIdeaWithNote = {
            ...firstIdea,
            notes: [{ id: 'n_new', text: newNoteContent, createdAt: 1678889000000 }]
        };
        const refreshedIdeasData = [updatedFirstIdeaWithNote, mockIdeasData[1]];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => refreshedIdeasData,
        });

        addNoteForm.dispatchEvent(new Event('submit'));

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(fetch).toHaveBeenCalledTimes(3); // Initial, Add Note POST, Refresh GET
        expect(fetch).toHaveBeenNthCalledWith(2, `/api/ideas/${firstIdea.id}/notes`, expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ noteText: newNoteContent }),
        }));

        const notesModal = document.getElementById('notes-modal');
        expect(notesModal.style.display).toBe('none'); // Modal should close

        // Verify the main list reflects the change (though it's indirect via fetchIdeas)
        // To directly test modal update, we'd need to reopen it or check its content before close.
        // The current script closes modal and refetches all ideas.
        // We can check if the main list's data would contain the note if we were to reopen.
        const ideasUl = document.getElementById('ideas-ul');
        // The actual DOM update for notes isn't directly visible on the main list items in this UI design.
        // The test confirms the API call was made and the list was refreshed.
    });

    test('should close notes modal when close button is clicked', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        const notesButton = document.querySelectorAll('#ideas-ul li .notes-button')[0];
        notesButton.click(); // Open modal

        const notesModal = document.getElementById('notes-modal');
        expect(notesModal.style.display).toBe('block');

        const closeButton = document.querySelector('.close-button');
        closeButton.click();
        expect(notesModal.style.display).toBe('none');
    });

    test('should close notes modal when clicking outside modal content', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        const notesButton = document.querySelectorAll('#ideas-ul li .notes-button')[0];
        notesButton.click(); // Open modal

        const notesModal = document.getElementById('notes-modal');
        expect(notesModal.style.display).toBe('block');

        notesModal.click(); // Simulate click on modal background
        expect(notesModal.style.display).toBe('none');
    });

});