'use strict';

const CommentsService = {
  list(knex) {
    return knex('blogful_comments').select('*');
  },

  findById(knex, id) {
    return knex('blogful_comments').where({id}).first('*');
  },

  insert(knex, comment) {
    return knex('blogful_comments')
      .insert(comment)
      .returning('*')
      .then(rows => rows[0]);
  },

  update(knex, id, comment) {
    return knex('blogful_comments')
      .where({id})
      .update(comment)
      .returning('*')
      .then(rows => rows[0]);
  },

  delete(knex, id) {
    return knex('blogful_comments').where({id}).delete();
  }
};

module.exports = CommentsService;