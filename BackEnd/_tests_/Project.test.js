const db = require('../db'); // adjust this if your DB connection file is elsewhere

function executeQuery(query, params, callback) {
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return callback(err);
    }
    callback(null, results);
  });
}

module.exports = executeQuery;
