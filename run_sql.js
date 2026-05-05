const fs = require('fs');
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres'
    });
    
    try {
        await client.connect();
        const file = process.argv[2] || 'supabase_schema.sql';
        const sql = fs.readFileSync(file, 'utf8');
        await client.query(sql);
        console.log(`Schema ${file} updated successfully!`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
