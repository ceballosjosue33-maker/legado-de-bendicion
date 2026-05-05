const fs = require('fs');
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres'
    });
    
    try {
        await client.connect();
        const sql = fs.readFileSync('update_course.sql', 'utf8');
        await client.query(sql);
        console.log('Course schema updated successfully!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
