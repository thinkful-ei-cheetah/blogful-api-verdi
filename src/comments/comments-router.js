'use strict';

const path = require('path');
const express = require('express');
const xss = require('xss');
const CommentsService = require('./comments-service');

const commentsRouter = express.Router();
const jsonParser = express.json();

const sanitizeFields = user => {
  const filtered = {};
  for (const [key, value] of Object.entries(user)) {
    filtered[key] = xss(value);
  }
  return filtered;
};

commentsRouter
  .route('/')
  .get(async (req, res, next) => {
    try {
      const comments = await CommentsService.list(req.app.get('db'));
      res.json(comments);
    } catch(err) {
      next(err);
    } 
  })
  .post(jsonParser, async (req, res, next) => {
    const db = req.app.get('db');
    const { text, article_id, user_id, date_commented } = req.body;
    let newComment = { text, article_id, user_id };

    for (const [key, value] of Object.entries(newComment)) {
      if (value === null) {
        return next({status: 400, message: `Missing '${key}' in request body`});
      }
    }

    if (date_commented) newComment.date_commented = date_commented;
    newComment = sanitizeFields(newComment);

    try {
      const comment = await CommentsService.insert(db, newComment);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${comment.id}`))
        .json(comment);
    } catch(err){
      next(err);
    }
  });

commentsRouter
  .route('/:comment_id')
  .all(async (req, res, next) => {
    try {
      const comment = await CommentsService.findById(req.app.get('db'), req.params.comment_id);
      if (!comment) {
        return next({status: 404, message: 'Comment doesn\'t exist'});
      }
      res.comment = comment;
      next();
    } catch(err) {
      next(err);
    }
  })
  .get((req, res, next) => {
    res.json(res.comment);
  })
  .delete(async (req, res, next) => {
    try {
      await CommentsService.delete(req.app.get('db'), req.params.comment_id);
      res.status(204).end();
    } catch(err) {
      next(err);
    }
  })
  .patch(jsonParser, async (req, res, next) => {
    const { text, date_commented } = req.body;
    let commentToUpdate = { text };
    if (date_commented) commentToUpdate.date_commented = date_commented;

    const numberOfValues = Object.values(commentToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return next({status: 400, message: 'Request body must content either \'text\', \'date_commented\''});
    }
    commentToUpdate = sanitizeFields(commentToUpdate);
    try {
      await CommentsService.update(
        req.app.get('db'),
        req.params.comment_id,
        commentToUpdate
      );
      res.status(204).end();
    } catch(err) {
      next(err);
    }
  });

module.exports = commentsRouter;