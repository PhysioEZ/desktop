const axios = require('axios');

async function testLocalLogin() {
    console.log("Testing local login...");
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'reception',
            password: '123'
        });
        console.log("Login Success:", response.data.status);
    } catch (err) {
        console.error("Login Failed:", err.response?.status, err.response?.data || err.message);
    }
}

testLocalLogin();
