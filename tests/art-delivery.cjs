const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),assets=require('../v3/assets/delivery-manifest.json').assets;
const ingredients=assets.filter(a=>a.source.startsWith('v3/assets/ingredients/'));
assert.equal(ingredients.length,27);
for(const a of assets){
 const b=fs.readFileSync(path.join(root,a.file)),original=fs.readFileSync(path.join(root,a.source));
 assert.equal(crypto.createHash('sha256').update(b).digest('hex'),a.sha256);
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),a.sourceSha256);
 assert.equal(b.length,a.bytes);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 assert(a.width<=1024&&a.height<=1024);assert(b.length<original.length,a.file+' must be smaller than original');
}
const original=ingredients.reduce((n,a)=>n+fs.statSync(path.join(root,a.source)).size,0),served=ingredients.reduce((n,a)=>n+a.bytes,0);
assert(served<original/10,'Ingredient delivery must remove at least 90% of original bytes');
assert(ingredients.every(a=>a.width<=512&&a.height<=512));
console.log(`PASS artwork delivery: ${assets.length} preserved-source derivatives, ingredients ${original} -> ${served} bytes (${(100*(1-served/original)).toFixed(1)}% smaller).`);
