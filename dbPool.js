const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "l6glqt8gsx37y4hs.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "czh7xmhd4d2kwnou",
  password: "ncbg0jcvja9pthf2",
  database: "u1b2u5q5kobnu2lx",
});

module.exports = pool;
