// Same builder used for the private game, with fictional configuration only.
module.exports=()=>require('node:child_process').execFileSync(process.execPath,['tests/prepare-v3.cjs'],{stdio:'inherit'});
