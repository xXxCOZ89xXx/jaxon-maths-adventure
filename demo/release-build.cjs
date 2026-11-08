'use strict';
// Cloudflare's Git build supplies this non-secret branch name. No backend env is read.
if(process.env.CF_PAGES_BRANCH!=='release/ipad')throw Error('Public demo deployment builds are allowed only from release/ipad. Use demo/build.cjs for local QA.');
const {execFileSync}=require('node:child_process');
execFileSync(process.execPath,[require.resolve('./build.cjs')],{stdio:'inherit'});
execFileSync(process.execPath,[require.resolve('./check.cjs')],{stdio:'inherit'});
