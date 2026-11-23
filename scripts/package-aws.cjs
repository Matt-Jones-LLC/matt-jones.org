#!/usr/bin/env node
// Package only public assets. Never upload the repository root wholesale.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'infra/site.json')));
const out = path.join(root, '_aws_site');
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out);
const files = execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const publicRoots = new Set(['assets','games','about','credits']);
const publicFiles = new Set(['index.html','404.html','favicon.svg','robots.txt','sitemap.xml','LICENSE']);
let count = 0;
for (const file of files) {
  let rel;
  if(config.source === 'site') {
    if(!file.startsWith('site/')) continue;
    rel = file.slice(5);
  } else {
    if(!publicRoots.has(file.split('/')[0]) && !publicFiles.has(file)) continue;
    rel = file;
  }
  if(rel.split('/').some(x => x.startsWith('.') || ['AGENTS.md','CLAUDE.md','README.md','CNAME'].includes(x))) continue;
  const source = path.join(root,file);
  if(!fs.lstatSync(source).isFile()) throw new Error('Non-regular asset: '+file);
  const dest = path.join(out,rel);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.copyFileSync(source,dest);
  count++;
}
for(const f of ['index.html','404.html','assets/monitoring.js']) {
  if(!fs.existsSync(path.join(out,f))) throw new Error('Missing required asset '+f);
}
console.log(`Packaged ${count} public files for ${config.domain}`);
