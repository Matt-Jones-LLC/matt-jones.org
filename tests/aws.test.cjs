const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('infra/directory-index.js','utf8'),context);
test('directory routes keep relative assets valid and preserve repeated query values',()=>{
 const result=context.handler({request:{uri:'/games/shapes',querystring:{a:{multiValue:[{value:'1'},{value:'2'}]}}}});
 assert.equal(result.statusCode,301);
 assert.equal(result.headers.location.value,'/games/shapes/?a=1&a=2');
});
test('directory index rewrites and static files remain unchanged',()=>{
 for (const [uri,expected] of [['/','/index.html'],['/games/shapes/','/games/shapes/index.html'],['/assets/site.js','/assets/site.js'],['/404.html','/404.html']]) {
  assert.equal(context.handler({request:{uri,querystring:{}}}).uri,expected);
 }
});
test('published package excludes operational files',()=>{
 const files=fs.readdirSync('_aws_site',{recursive:true});
 for(const file of files) assert.ok(!/(^|\/)(\.git|infra|scripts|AGENTS.md|CLAUDE.md|README.md|CNAME)(\/|$)/.test(file),file);
 assert.ok(files.includes('index.html'));
 assert.ok(files.includes('404.html'));
});

test('www redirects to its own apex without redirecting preview hosts',()=>{
 const result=context.handler({request:{uri:'/games/',headers:{host:{value:'www.coolmatt.games'}},querystring:{x:{value:'1'}}}});
 assert.equal(result.headers.location.value,'https://coolmatt.games/games/?x=1');
 assert.equal(context.handler({request:{uri:'/',headers:{host:{value:'example.cloudfront.net'}},querystring:{}}}).uri,'/index.html');
});
test('deployed edge function matches the tested source',()=>{
 const template=JSON.parse(fs.readFileSync('infra/sites.cloudformation.json'));
 for(const site of ['Company','Arcade','Lab']) assert.equal(template.Resources[site+'Index'].Properties.FunctionCode,fs.readFileSync('infra/directory-index.js','utf8'));
});
