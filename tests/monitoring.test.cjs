const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(require('node:path').join(__dirname,'../site/assets/monitoring.js'), 'utf8');
function run({hostname='matt-jones.org', stored=null, gpc=false, configured=true}={}) {
  const calls=[], scripts=[];
  const element=()=>({style:{},setAttribute(){},addEventListener(){},appendChild(){}});
  const rum={init:c=>calls.push(['init',c]),setGlobalContextProperty(){},setTrackingConsent:c=>calls.push(['consent',c]),addAction:(...v)=>calls.push(['action',...v])};
  const config={applicationId:configured?'app':'',clientToken:'public-token',site:'datadoghq.com',sdkUrl:'https://example.invalid/sdk.js',hosts:['matt-jones.org']};
  const window={MJ_MONITORING:config,DD_RUM:rum,CMG:{countPlay(){calls.push(['play']);return 42}}};
  const context={window,location:{hostname,pathname:'/games/shapes/'},navigator:{globalPrivacyControl:gpc},URL,
    localStorage:{getItem(){return stored},setItem(k,v){stored=v}},
    document:{createElement:element,body:element(),head:{appendChild:s=>scripts.push(s)},getElementById(){return null}}};
  vm.runInNewContext(code,context);
  return {window,calls,scripts};
}
test('no SDK loads before explicit consent',()=>{
  const r=run();assert.equal(r.scripts.length,0);assert.equal(r.window.MJTelemetry.state.enabled,false);
});
test('consent enables diagnostics without replay and withdrawal stops events',()=>{
  const r=run();r.window.MJTelemetry.setConsent(true);assert.equal(r.scripts.length,1);r.scripts[0].onload();
  const config=r.calls.find(c=>c[0]==='init')[1];assert.equal(config.sessionReplaySampleRate,0);assert.equal(config.trackUserInteractions,false);
  assert.equal(r.window.CMG.countPlay(),42);assert.equal(r.calls.filter(c=>c[0]==='action').length,1);
  const event={view:{url:'https://matt-jones.org/?token=secret#private'}};assert.equal(config.beforeSend(event),true);assert.equal(event.view.url,'https://matt-jones.org/');
  r.window.MJTelemetry.setConsent(false);r.window.CMG.countPlay();assert.equal(r.calls.filter(c=>c[0]==='action').length,1);assert.equal(config.beforeSend({}),false);
});
test('browser preference, preview hosts, and missing config block collection',()=>{
  for(const options of [{gpc:true},{hostname:'localhost'},{configured:false}]){
    const r=run({...options,stored:'granted'});r.window.MJTelemetry.setConsent(true);assert.equal(r.scripts.length,0);assert.equal(r.window.MJTelemetry.state.enabled,false);
  }
});
test('withdrawing during SDK download initializes without consent',()=>{
  const r=run();r.window.MJTelemetry.setConsent(true);r.window.MJTelemetry.setConsent(false);r.scripts[0].onload();assert.equal(r.calls.find(c=>c[0]==='init')[1].trackingConsent,'not-granted');
});
test('blocked SDK leaves game functional and offers retry',()=>{
  const r=run();r.window.MJTelemetry.setConsent(true);r.scripts[0].onerror();assert.equal(r.window.CMG.countPlay(),42);assert.equal(r.window.MJTelemetry.state.reason,'unavailable');r.window.MJTelemetry.setConsent(false);r.window.MJTelemetry.setConsent(true);assert.equal(r.scripts.length,2);
});
