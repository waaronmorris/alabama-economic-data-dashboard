#!/bin/bash

# Script to run Puppeteer diagnostics via Docker
echo "Running Puppeteer diagnostics via Docker..."
echo "Connecting to host.docker.internal:3000"

# Create a simple diagnostic script for Docker
cat > /tmp/docker-diagnose.js << 'EOF'
const puppeteer = require('puppeteer');

async function diagnoseDashboard() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    
    const logs = [];
    const errors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    console.log('🔍 Connecting to dashboard at host.docker.internal:3000...');
    
    // Test main dashboard
    try {
      await page.goto('http://host.docker.internal:3000', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      console.log('✅ Main dashboard loaded successfully');
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.error('❌ Main dashboard failed:', error.message);
    }

    // Test living-indicators page
    try {
      await page.goto('http://host.docker.internal:3000/living-indicators', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      console.log('✅ Living-indicators page loaded successfully');
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.error('❌ Living-indicators page failed:', error.message);
    }

    // Check for charts and content
    const pageContent = await page.evaluate(() => {
      return {
        hasCharts: document.querySelectorAll('svg').length > 0,
        chartCount: document.querySelectorAll('svg').length,
        hasErrorMessages: document.querySelectorAll('[class*="error"]').length > 0,
        hasData: document.body.innerText.includes('FRED') || document.body.innerText.includes('Economic'),
        pageTitle: document.title,
        bodyLength: document.body.innerText.length
      };
    });

    // Report findings
    console.log('\n📊 DIAGNOSTIC RESULTS');
    console.log('====================');
    console.log(`Charts found: ${pageContent.chartCount}`);
    console.log(`Has economic data: ${pageContent.hasData}`);
    console.log(`Page title: ${pageContent.pageTitle}`);
    console.log(`Content length: ${pageContent.bodyLength} characters`);
    
    console.log(`\n📝 Console Messages (${logs.length}):`);
    logs.slice(0, 10).forEach((log, i) => {
      console.log(`${i + 1}. [${log.type}] ${log.text.slice(0, 100)}...`);
    });
    
    console.log(`\n🚨 JavaScript Errors (${errors.length}):`);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.message}`);
    });
    
    console.log(`\n🌐 Network Failures (${networkErrors.length}):`);
    networkErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.url} - ${error.failure?.errorText}`);
    });

    console.log('\n✅ Diagnostic complete!');

  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

diagnoseDashboard().catch(console.error);
EOF

# Run with Docker
docker run --rm -v /tmp/docker-diagnose.js:/app/diagnose.js \
  --add-host=host.docker.internal:host-gateway \
  node:18-alpine sh -c "
    cd /app && 
    npm install puppeteer && 
    node diagnose.js
  "