const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Find and remove the orphan return block (old CheckoutBtn remnant)
const lines = content.split('\n');
const result = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect the orphan return block
  if (line.trim() === 'return (' && lines[i+1] && lines[i+1].includes('handleCheckout') && lines[i+1].includes('disabled={loading}')) {
    skip = true;
  }
  
  // Stop skipping after the closing };
  if (skip && line.trim() === '};' && !lines[i-1]?.includes('return')) {
    skip = false;
    continue;
  }
  
  if (!skip) {
    result.push(line);
  }
}

content = result.join('\n');
fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done! Lines removed.');

// Verify line 215-220
const verify = content.split('\n');
for (let i = 212; i < 222; i++) {
  console.log(`${i+1}: ${verify[i]}`);
}
