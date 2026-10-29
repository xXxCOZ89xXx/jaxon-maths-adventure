module.exports=()=>{require('node:child_process').execFileSync(process.execPath,['tests/prepare-v3.cjs'],{stdio:'inherit'});require('./prepare-v52-production.cjs')();};
