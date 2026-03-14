import fetch from 'node-fetch';

async function testWrongLogin() {
    try {
        console.log('Testing wrong admin login...');
        const res = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'wrong', password: 'wrong' })
        });
        
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testWrongLogin();
