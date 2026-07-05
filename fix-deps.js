const fs = require('fs');
function addDeps(pkg, deps) {
  const p = require(`./packages/${pkg}/package.json`);
  p.dependencies = p.dependencies || {};
  deps.forEach(d => p.dependencies[d] = '*');
  fs.writeFileSync(`./packages/${pkg}/package.json`, JSON.stringify(p, null, 2));
}

addDeps('core', ['@animafy/assets', '@animafy/emoji', '@animafy/text', '@napi-rs/canvas']);
addDeps('discord', ['@animafy/core', '@animafy/assets']);
addDeps('decoders', ['@animafy/assets', 'omggif']);
addDeps('examples', ['@animafy/assets', '@animafy/decoders', '@animafy/core', '@animafy/discord']);
