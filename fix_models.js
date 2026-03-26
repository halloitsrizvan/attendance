const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir);

for (const file of files) {
  if (file.endsWith('.js')) {
    const fullPath = path.join(modelsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // We want to avoid patching something already patched.
    // So we only replace if it's not already preceded by "mongoose.models."
    const regex = /(?<!mongoose\.models\[[^\]]+\]\s*\|\|\s*)mongoose\.model\(\s*(['"`])([^'"`]+)\1\s*,\s*([^)]+)\)/g;
    
    let modified = content.replace(regex, (match, quote, modelName, schemaVar) => {
      return `mongoose.models[${quote}${modelName}${quote}] || mongoose.model(${quote}${modelName}${quote}, ${schemaVar})`;
    });

    if (modified !== content) {
      fs.writeFileSync(fullPath, modified);
      console.log(`Patched ${file}`);
    }
  }
}
