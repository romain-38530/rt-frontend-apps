/**
 * Lambda Handler pour les cron jobs SYMPHONI.A
 * Appelle les endpoints de clôture et archivage automatique
 */
const https = require('https');

const API_HOST = 'rt-orders-api-prod-v2.eba-4tprbbqu.eu-central-1.elasticbeanstalk.com';

async function callApi(path, method = 'POST') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 80,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'symphonia-cron-2024'
      }
    };

    // Use http for EB (no SSL on default)
    const http = require('http');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const results = {};

  // Déterminer quelle action exécuter basé sur la règle EventBridge
  const ruleName = event.resources?.[0]?.split('/')?.pop() || '';

  try {
    if (ruleName.includes('auto-close') || event.action === 'auto-close') {
      console.log('Executing auto-close...');
      const closeResult = await callApi('/api/v1/closure/auto-close', 'POST');
      results.autoClose = closeResult;
      console.log('Auto-close result:', closeResult);
    }

    if (ruleName.includes('auto-archive') || event.action === 'auto-archive') {
      console.log('Executing auto-archive...');
      const archiveResult = await callApi('/api/v1/closure/auto-archive', 'POST');
      results.autoArchive = archiveResult;
      console.log('Auto-archive result:', archiveResult);
    }

    // Si appelé manuellement sans action spécifique, exécuter les deux
    if (!ruleName && !event.action) {
      console.log('Executing both auto-close and auto-archive...');
      results.autoClose = await callApi('/api/v1/closure/auto-close', 'POST');
      results.autoArchive = await callApi('/api/v1/closure/auto-archive', 'POST');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results
      })
    };
  } catch (error) {
    console.error('Cron job error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
