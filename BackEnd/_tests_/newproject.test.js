const db = require('../db'); // Make sure db.js is in the parent directory

function executeQuery(query, params, callback) {
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return callback(err);
    }
    callback(null, results);
  });
}

module.exports = executeQuery;
