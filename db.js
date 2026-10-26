const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'the_office_papelaria',
    password: 'admin',
    port: 5432,
});

async function query(text, params) {
    return pool.query(text, params);
}

module.exports = {
    query,
    pool
};