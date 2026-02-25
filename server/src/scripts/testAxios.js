const axios = require('axios');

async function testAxios() {
    const url = 'https://prospine.in/admin/desktop/read.php';
    const params = {
        table: 'patients',
        token: '0f89e3a09848a6b0bb8ca315348e880e811ec0173ca1d60fcfa7c58044c521f4'
    };

    try {
        const response = await axios.get(url, { params });
        console.log("Response:", JSON.stringify(response.data).substring(0, 100));
    } catch (err) {
        console.error("Axios Error:", err.response?.status, err.response?.data || err.message);
    }
}

testAxios();
