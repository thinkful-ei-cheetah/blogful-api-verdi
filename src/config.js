'use strict';
module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DATABASE_URL || 'postgres://dunder-mifflin@localhost/blogful',
  TEST_DB_URL: process.env.TEST_DB_URL || 'postgres://dunder-mifflin@localhost/blogful-test'
};