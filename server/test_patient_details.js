
const fetch = require('node-fetch');

(async () => {
    try {
        const url = 'http://localhost:3000/api/reception/patients'\;
        const body = {
            action: 'fetch_details',
            patient_id: 1 
        };
        console.log('Hitting ' + url + ' with body ' + JSON.stringify(body) + '...');
        const res = await fetch(url, {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify(body)
        });
        const status = res.status;
        const text = await res.text();
        console.log('STATUS:', status);
        console.log('BODY:', text);
    } catch (e) {
        console.error('FETCH ERROR:', e);
    }
})();

