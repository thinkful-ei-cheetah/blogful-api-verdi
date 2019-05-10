'use strict';

const UsersService = {
  list(knex) {
    return knex('blogful_users').select('*');
  },

  findById(knex, id) {
    return knex('blogful_users').where({id}).first('*');
  },

  insert(knex, user) {
    return knex('blogful_users')
      .insert(user)
      .returning('*')
      .then(rows => rows[0]);
  },

  update(knex, id, fields) {
    return knex('blogful_users')
      .where({id})
      .update(fields)
      .returning('*')
      .then(rows => rows[0]);
  },

  delete(knex, id) {
    return knex('blogful_users')
      .where({id})
      .delete();
  }
};

module.exports = UsersService;