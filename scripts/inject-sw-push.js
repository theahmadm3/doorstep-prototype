// Script to inject push notification handlers into generated service worker
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');

    if (!swContent.includes('sw-push.js')) {
        swContent = `importScripts('/sw-push.js');\n\n${swContent}`;
        fs.writeFileSync(swPath, swContent);
        console.log('✅ Successfully injected push notification handlers into sw.js');
    } else {
        console.log('ℹ️  Push notification handlers already injected');
    }
} else {
    console.log('⚠️  sw.js not found - make sure next-pwa has generated it');
}
