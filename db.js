// db.js
const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',          // Database host
  user: 'root',               // Database username (default for XAMPP is 'root')
  password: '',               // Database password (default for XAMPP is an empty string)
  database: 'password_manager' // Name of your database
});

// Connect to MySQL and log any errors
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the MySQL database.');
});

module.exports = connection;
