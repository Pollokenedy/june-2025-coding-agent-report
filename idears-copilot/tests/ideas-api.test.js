const request = require('supertest');
const fs = require('fs');
const path = require('path');
const express = require('express');
const serverPath = path.join(__dirname, '../backend/server.js');
let app;

beforeAll(() => {
  // Clear data file before tests
  const dataFile = path.join(__dirname, '../backend/data.json');
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  delete require.cache[require.resolve(serverPath)];
  app = require(serverPath);
});

describe('Ideas API', () => {
  it('should create a new idea', async () => {
    const res = await request(app)
      .post('/ideas')
      .field('title', 'Test Idea')
      .field('notes', 'Initial note');
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Idea');
    expect(res.body.notes).toContain('Initial note');
    expect(res.body.votes).toBe(0);
  });

  it('should list ideas sorted by votes', async () => {
    const res = await request(app).get('/ideas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Test Idea');
  });

  it('should vote for an idea', async () => {
    const ideas = (await request(app).get('/ideas')).body;
    const id = ideas[0].id;
    const res = await request(app).post(`/ideas/${id}/vote`);
    expect(res.statusCode).toBe(200);
    expect(res.body.votes).toBe(1);
  });

  it('should add a note to an idea', async () => {
    const ideas = (await request(app).get('/ideas')).body;
    const id = ideas[0].id;
    const res = await request(app)
      .post(`/ideas/${id}/notes`)
      .field('note', 'Second note');
    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toContain('Second note');
  });
});
