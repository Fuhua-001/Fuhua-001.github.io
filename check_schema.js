const db = require('./src/config/db');

async function checkSchema() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM sales_pr');
    console.log(cols);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkSchema();
