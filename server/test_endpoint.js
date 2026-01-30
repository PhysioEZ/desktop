const fetch = require('node-fetch');

(async () => {
    try {
        const url = 'http://localhost:3000/api/reception/get_pending_approvals?branch_id=1';
        console.log(`Hitting ${url}...`);
        const res = await fetch(url);
        const status = res.status;
        const text = await res.text();
        console.log("STATUS:", status);
        console.log("BODY:", text);
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
})();
