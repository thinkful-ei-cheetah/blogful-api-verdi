'use strict';
/* globals supertest */
process.env.TZ = 'UTC';
const { expect } = require('chai');
const knex = require('knex');
const app = require('../../src/app');
const articleFixture = require('../fixtures/articles_fixture');

describe('Articles Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
  });

  const testArticles = articleFixture.makeArticlesArray();

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('blogful_articles').truncate());
  beforeEach('set the db instance', () => app.set('db', db));
  afterEach('clear the table', () => db('blogful_articles').truncate());

  describe('GET /api/articles', () => {
    context('when articles exist', () => {
      beforeEach('seed the table', () => db('blogful_articles').insert(testArticles));
      
      it('returns all the articles', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, testArticles);
      });
    });

    context('when NO articles exist', () => {
      it('returns an empty array', () => {
        return supertest(app)
          .get('/api/articles')
          .expect(200, []);
      });
    });
  });

  describe('GET /api/articles/:article_id', () => {
    beforeEach('seed the table', () => db('blogful_articles').insert(testArticles));  

    it('returns an article by id', () => {
      const article = testArticles[0];
      return supertest(app)
        .get(`/api/articles/${article.id}`)
        .expect(200, article);
    });

    it('returns 404 when no article is found', () => {
      return supertest(app)
        .get('/api/articles/100000023')
        .expect(404, {'message':'article not found'});
    });

    it('returns a 400 if improper id given', () => {
      return supertest(app)
        .get('/api/articles/abc123')
        .expect(400, {'message':'invalid article id'});
    });
  });

  describe('POST /api/articles', () => {
    it('creates a new article', () => {
      const newArticle = {
        id: 1,
        date_published: '1925-12-22T16:28:32.615Z',
        title: 'First test post!',
        style: 'Story',
        content: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.'
      };

      return supertest(app)
        .post('/api/articles')
        .send(newArticle)
        .set('Content-Type', 'application/json')
        .expect(201)
        .then(res => {
          expect(res.body).to.eql(newArticle);
          expect(res.headers.location).to.equal(`/api/articles/${newArticle.id}`);
        }); 
    });
  });
});
