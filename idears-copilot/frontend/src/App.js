import React, { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [ideas, setIdeas] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const res = await fetch(`${API_URL}/ideas`);
    const data = await res.json();
    setIdeas(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('notes', notes);
    for (let i = 0; i < attachments.length; i++) {
      formData.append('attachments', attachments[i]);
    }
    await fetch(`${API_URL}/ideas`, {
      method: 'POST',
      body: formData
    });
    setTitle('');
    setNotes('');
    setAttachments([]);
    fetchIdeas();
    setLoading(false);
  };

  const handleVote = async (id) => {
    await fetch(`${API_URL}/ideas/${id}/vote`, { method: 'POST' });
    fetchIdeas();
  };

  return (
    <div className="App">
      <h1>Idea Collector</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Idea title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <br />
        <input
          type="file"
          multiple
          onChange={e => setAttachments(e.target.files)}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Idea'}
        </button>
      </form>
      <h2>Ideas</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ideas.map(idea => (
          <li key={idea.id} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
            <strong>{idea.title}</strong> <br />
            Votes: {idea.votes} <button onClick={() => handleVote(idea.id)}>Vote</button>
            <br />
            {idea.notes && idea.notes.length > 0 && (
              <ul>
                {idea.notes.map((note, idx) => <li key={idx}>{note}</li>)}
              </ul>
            )}
            {idea.attachments && idea.attachments.length > 0 && (
              <div>
                Attachments:
                <ul>
                  {idea.attachments.map((file, idx) => (
                    <li key={idx}>
                      <a href={`${API_URL}${file}`} target="_blank" rel="noopener noreferrer">{file.split('/').pop()}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
