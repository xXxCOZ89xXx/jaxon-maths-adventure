'use strict';
// Cloudflare's Git build supplies this non-secret branch name. No backend env is read.
// release/demo is the proposed demo-only branch (docs/RELEASE-PLAN-20261126.md, Route 3); it is used only if the owner moves the demo project to it.
if(!['release/ipad','release/demo'].includes(process.env.CF_PAGES_BRANCH))throw Error('Public demo deployment builds are allowed only from release/ipad or release/demo. Use demo/build.cjs for local QA.');
// The owner must approve the demo sample before any release build can publish it.
const sample=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'sample.json'),'utf8'));
if(!String(sample.status||'').startsWith('approved'))throw Error('The demo sample is not approved for release: '+sample.status);
const {execFileSync}=require('node:child_process');
execFileSync(process.execPath,[require.resolve('./build.cjs')],{stdio:'inherit'});
execFileSync(process.execPath,[require.resolve('./check.cjs')],{stdio:'inherit'});
