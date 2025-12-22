const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');

// Test the import endpoint with the actual file
async function testImport(filePath) {
  try {
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;

    console.log('\n📤 Testing import with actual file...');
    console.log('File:', filePath);
    console.log('File size:', (fileBuffer.length / 1024).toFixed(2), 'KB');
    console.log('Base64 length:', base64Data.length);

    // First, let's check the file structure
    console.log('\n📋 Analyzing file structure...');
    const workbook = XLSX.readFile(filePath);
    console.log('Sheets:', workbook.SheetNames);
    
    if (workbook.SheetNames.length > 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false, header: 1 });
      console.log('Total rows:', records.length);
      if (records.length > 0) {
        console.log('First row (headers):', records[0]);
        if (records.length > 1) {
          console.log('Second row (sample data):', records[1]);
        }
      }
      
      // Get column names from first row
      const headers = records[0] || [];
      console.log('Column headers:', headers);
    }

    // Login to get token
    const API_URL = process.env.API_URL || 'http://localhost:3000/api';
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
    
    console.log('\n🔐 Authenticating...');
    let token = null;
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: 'admin@inventory.com',
        password: 'admin123'
      });
      token = loginResponse.data.token;
      console.log('✓ Login successful');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return false;
    }

    // Try backend first (port 5000)
    console.log('\n🧪 Testing backend endpoint (port 5000)...');
    try {
      const backendResponse = await axios.post(`${BACKEND_URL}/parts/import-xlsx`, {
        fileData: dataUrl,
        fileName: path.basename(filePath)
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000,
        validateStatus: function (status) {
          return status < 600;
        }
      });

      console.log('Backend Response Status:', backendResponse.status);
      if (backendResponse.status === 200 || backendResponse.status === 201) {
        console.log('✅ Backend import successful!');
        console.log('Response:', JSON.stringify(backendResponse.data, null, 2));
        if (backendResponse.data.results) {
          console.log(`\n📊 Results:`);
          console.log(`  - Success: ${backendResponse.data.results.success}`);
          console.log(`  - Failed: ${backendResponse.data.results.failed}`);
          if (backendResponse.data.results.errors && backendResponse.data.results.errors.length > 0) {
            console.log(`  - Errors (first 5):`);
            backendResponse.data.results.errors.slice(0, 5).forEach(err => {
              console.log(`    Row ${err.row}: ${err.error}`);
            });
          }
        }
        return true;
      } else {
        console.error('Backend returned error:', backendResponse.status);
        console.error('Response:', JSON.stringify(backendResponse.data, null, 2));
      }
    } catch (error) {
      console.error('Backend request failed:', error.response?.status, error.response?.data || error.message);
    }

    // Try frontend endpoint (port 3000)
    console.log('\n🧪 Testing frontend endpoint (port 3000)...');
    try {
      const frontendResponse = await axios.post(`${API_URL}/parts/import-xlsx`, {
        fileData: dataUrl,
        fileName: path.basename(filePath)
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000,
        validateStatus: function (status) {
          return status < 600;
        }
      });

      console.log('Frontend Response Status:', frontendResponse.status);
      if (frontendResponse.status === 200 || frontendResponse.status === 201) {
        console.log('✅ Frontend import successful!');
        console.log('Response:', JSON.stringify(frontendResponse.data, null, 2));
        return true;
      } else {
        console.error('Frontend returned error:', frontendResponse.status);
        console.error('Response:', JSON.stringify(frontendResponse.data, null, 2));
      }
    } catch (error) {
      console.error('Frontend request failed:', error.response?.status);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error:', error.message);
      }
    }

    return false;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Main
async function runTest() {
  console.log('🧪 Testing XLSX Import with Actual File\n');
  console.log('='.repeat(50));

  const filePath = path.join(__dirname, 'STOCK_LIST ......xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.error('Please ensure the file "STOCK_LIST ......xlsx" is in the project root');
    process.exit(1);
  }

  const success = await testImport(filePath);

  if (success) {
    console.log('\n✅ Test passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Test failed!');
    process.exit(1);
  }
}

runTest();

