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
 for(const site of ['Company','Arcade']) assert.equal(template.Resources[site+'Index'].Properties.FunctionCode,fs.readFileSync('infra/directory-index.js','utf8'));
});

test('domain aliases preserve paths and query strings on the correct site',()=>{
 for (const [host,target] of [['matt-jones.org','mattjonesllc.com'],['www.matt-jones.org','mattjonesllc.com'],['www.mattjonesllc.com','mattjonesllc.com'],['coolmattgames.io','coolmatt.games'],['www.coolmattgames.io','coolmatt.games']]) {
  const result=context.handler({request:{uri:'/games/shapes/',headers:{host:{value:host}},querystring:{a:{multiValue:[{value:'1'},{value:'2'}]}}}});
  assert.equal(result.headers.location.value,'https://'+target+'/games/shapes/?a=1&a=2');
 }
});
test('aliases share hosting and no lab or future Flash resources incur charges',()=>{
 const t=JSON.parse(fs.readFileSync('infra/sites.cloudformation.json'));
 assert.equal(Object.values(t.Resources).filter(r=>r.Type==='AWS::CloudFront::Distribution').length,2);
 assert.equal(t.Parameters.MonthlyBudgetUSD.MaxValue,30);
 assert.deepEqual(t.Resources.CompanyDistribution.Properties.DistributionConfig.Aliases['Fn::If'][1],['mattjonesllc.com','www.mattjonesllc.com','matt-jones.org','www.matt-jones.org']);
 assert.deepEqual(t.Resources.ArcadeDistribution.Properties.DistributionConfig.Aliases['Fn::If'][1],['coolmatt.games','www.coolmatt.games','coolmattgames.io','www.coolmattgames.io']);
 assert.ok(!JSON.stringify(t).includes('repo:Matt-Jones-LLC/coolmattgames.io'));
});

test('slash redirects cannot become external network-path redirects',()=>{
 for (const uri of ['//outside.example/path','///outside.example/path',String.raw`/\outside.example/path`]) {
  const result=context.handler({request:{uri,querystring:{}}});
  assert.equal(new URL(result.headers.location.value,'https://coolmatt.games').origin,'https://coolmatt.games');
 }
});
test('alias redirects stay temporary during rollback and budgets exclude credits',()=>{
 const r=context.handler({request:{uri:'/',headers:{host:{value:'matt-jones.org'}},querystring:{}}});
 assert.equal(r.statusCode,302);
 const t=JSON.parse(fs.readFileSync('infra/sites.cloudformation.json'));
 assert.deepEqual(t.Resources.HostingBudget.Properties.Budget.CostTypes,{IncludeCredit:false,IncludeRefund:false});
});
