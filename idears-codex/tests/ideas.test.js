const request = require('supertest');
const app = require('../src/index');

describe('Ideas API', () => {
  it('should create a new idea', async () => {
    const res = await request(app)
      .post('/api/ideas')
      .send({ title: 'Test Idea' });
    expect(res.statusCode).toBe(201);
    expect(res.body.idea).toHaveProperty('id');
    expect(res.body.idea.title).toBe('Test Idea');
    expect(res.body.idea.votes).toBe(0);
  });

  it('should list ideas sorted by votes', async () => {
    const res1 = await request(app).post('/api/ideas').send({ title: 'Idea1' });
    const res2 = await request(app).post('/api/ideas').send({ title: 'Idea2' });
    await request(app).post(`/api/ideas/${res2.body.idea.id}/vote`);
    await request(app).post(`/api/ideas/${res2.body.idea.id}/vote`);
    await request(app).post(`/api/ideas/${res1.body.idea.id}/vote`);
    const list = await request(app).get('/api/ideas');
    expect(list.statusCode).toBe(200);
    expect(list.body.ideas[0].id).toBe(res2.body.idea.id);
    expect(list.body.ideas[1].id).toBe(res1.body.idea.id);
  });

  it('should return 400 when creating idea without title', async () => {
    const res = await request(app).post('/api/ideas').send({});
    expect(res.statusCode).toBe(400);
  });
});