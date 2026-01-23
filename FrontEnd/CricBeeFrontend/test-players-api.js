// Test function to run in browser console
// Copy and paste this into the browser console when on the Players page

async function testPlayersAPI() {
    try {
        console.log('=== Testing Players API ===');
        
        // Test 1: Check if API base is working
        console.log('1. Testing base API...');
        const baseResponse = await fetch('/club-profile/players-test');
        const baseData = await baseResponse.json();
        console.log('Base API Response:', baseData);
        
        // Test 2: Check real endpoint
        console.log('2. Testing real players endpoint...');
        const realResponse = await fetch('/club-profile/players');
        console.log('Real API Status:', realResponse.status);
        
        if (realResponse.ok) {
            const realData = await realResponse.json();
            console.log('Real API Response:', realData);
        } else {
            const errorData = await realResponse.text();
            console.log('Real API Error:', errorData);
        }
        
        // Test 3: Check with authentication headers
        console.log('3. Testing with auth headers...');
        const token = localStorage.getItem('access_token');
        if (token) {
            const authResponse = await fetch('/club-profile/players', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Auth API Status:', authResponse.status);
            
            if (authResponse.ok) {
                const authData = await authResponse.json();
                console.log('Auth API Response:', authData);
            } else {
                const authError = await authResponse.text();
                console.log('Auth API Error:', authError);
            }
        } else {
            console.log('No auth token found in localStorage');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testPlayersAPI();
