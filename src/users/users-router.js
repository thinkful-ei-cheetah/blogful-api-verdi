'use strict';

const path = require('path');
const express = require('express');
const xss = require('xss');
const UsersService = require('./users-service');

const usersRouter = express.Router();
const jsonParser = express.json();

const sanitizeFields = user => {
  const filtered = {};
  for (const [key, value] of Object.entries(user)) {
    filtered[key] = xss(value);
  }
  return filtered;
};

usersRouter
  .route('/')
  .get(async (req, res, next) => {
    const db = req.app.get('db');
    try {
      const users = await UsersService.list(db);
      res.json(users);
    } catch(err) {
      next(err);
    } 
  })
  .post(jsonParser, async (req, res, next) => {
    const db = req.app.get('db');
    const { fullname, username, nickname, password } = req.body;
    let newUser = { fullname, username };

    for (const [key, value] of Object.entries(newUser)) {
      if (value === null) {
        return next({status: 400, message: `Missing '${key}' in request body`});
      }
    }

    newUser.nickname = nickname;
    newUser.password = password;
    newUser = sanitizeFields(newUser);

    try {
      const user = await UsersService.insert(db, newUser);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${user.id}`))
        .json(user);
    } catch(err){
      next(err);
    }
  });

usersRouter
  .route('/:user_id')
  .all(async (req, res, next) => {
    try {
      const user = await UsersService.findById(req.app.get('db'), req.params.user_id);
      if (!user) {
        return next({status: 404, message: 'User doesn\'t exist'});
      }
      res.user = user ;
      next();
    } catch(err) {
      next(err);
    }
  })
  .get((req, res, next) => {
    res.json(res.user);
  })
  .delete(async (req, res, next) => {
    try {
      await UsersService.delete(req.app.get('db'), req.params.user_id);
      res.status(204).end();
    } catch(err) {
      next(err);
    }
  })
  .patch(jsonParser, async (req, res, next) => {
    const { fullname, username, password, nickname } = req.body;
    let userToUpdate = { fullname, username, password, nickname };

    const numberOfValues = Object.values(userToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return next({status: 400, message: 'Request body must content either \'fullname\', \'username\', \'password\' or \'nickname\''});
    }
    userToUpdate = sanitizeFields(userToUpdate);
    try {
      await UsersService.update(
        req.app.get('db'),
        req.params.user_id,
        userToUpdate
      );
      res.status(204).end();
    } catch(err) {
      next(err);
    }
  });

module.exports = usersRouter;