// /src/config.ts
// UPSTREAM URL CONFIGURATION
// Create a file where u will write the upsteram url
// For now it will be localhost but when i upload the api files in the server, i just need to change one file

// Determine if we are in development or production
// Since we are running on localhost for now, we point to the local php server path
export const API_BASE_URL = "http://localhost/admin/desktop/server/api"; 

// Example usage: `${API_BASE_URL}/reception/test_connection.php`
