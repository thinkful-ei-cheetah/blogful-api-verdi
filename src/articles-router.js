'use strict';

const path = require('path');
const express = require('express');
const articlesRouter = express.Router();
const bodyParser = express.json();
const ArticlesService = require('./services/ArticlesService');



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
  .post(bodyParser, async (req, res, next) => {
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
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    const {articleId} = req.params;
    if (isNaN(Number(articleId))) {
      return next({status: 400, message: 'invalid article id'});
    }
    try {
      const article = await ArticlesService.findById(db, articleId);
      if (!article) {
        return next({status: 404, message: 'article not found'});
      }
      res.json(article);
    } catch(err) {
      next(err);
    }
  });

module.exports = articlesRouter;