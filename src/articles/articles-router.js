'use strict';
const path = require('path');
const express = require('express');
const articlesRouter = express.Router();
const bodyParser = express.json();
const xss = require('xss');

const ArticlesService = require('./articles-service');

const ensureArticle = async (req, res, next) => {
  const db = req.app.get('db');
  const {articleId} = req.params;
  if (isNaN(Number(articleId))) {
    return next({status: 400, message: 'invalid article id'});
  }

  try {
    const article = await ArticlesService.findById(db, articleId);
    if (!article) {
      return next({status: 404, message: 'article not found'});
    } else {
      return next();
    }
  } catch(err) {
    return next(err);
  }
};

const filterParams = (req, res, next) => {
  const allowed = ['title', 'content', 'style', 'date_published'];
  const filtered = {};
  for (const [key, value] of Object.entries(req.body)) {
    if (allowed.includes(key)) {
      filtered[key] = xss(value);
    }
  }

  // check if filtered obj is empty
  if (Object.entries(filtered).length === 0 && filtered.constructor === Object) {
    next({status: 400, message: 'must include valid field of "title", "content", "style"'});
  } else {
    // author doesn't need to be validated
    filtered.author = req.body.author;
    req.body = filtered;
    next();
  }
  
};

articlesRouter
  .route('/')
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    try {
      const articles = await ArticlesService.list(db);
      res.json(articles);
    } catch(err) {
      next(err);
    }
  })
  .post(bodyParser, filterParams, async (req, res, next) => {
    const db = req.app.get('db');
    
    try {
      const article = await ArticlesService.insert(db, req.body);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${article.id}`))
        .json(article);
    } catch(err) {
      next(err);
    }
  });

articlesRouter
  .route('/:articleId')
  .all(ensureArticle)
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    const {articleId} = req.params;

    try {
      const article = await ArticlesService.findById(db, articleId);
      if (!article) {
        return next({status: 404, message: 'article not found'});
      }
      res.json(article);
    } catch(err) {
      next(err);
    }
  })
  .patch(bodyParser, filterParams, async (req, res, next) => {
    const db = req.app.get('db');
    const {articleId} = req.params;
    
    try {
      await ArticlesService.update(db, articleId, req.body);
      return res.status(204).end();
    } catch(err) {
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    const db = req.app.get('db');
    const {articleId} = req.params;

    try {
      await ArticlesService.delete(db, articleId);
      return res.status(204).end();
    } catch(err) {
      next(err);
    }
  });

module.exports = articlesRouter;