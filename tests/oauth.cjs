const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.PREVIEW_URL||'http://localhost:3000';
const user={id:'oauth-browser-test',name:'OAuth Reviewer',email:'oauth@example.invalid',role:'user',isVerified:true};
const output=path.join(__dirname,'..','test-artifacts','oauth');
async function mock(context,{signed=false,configured=true,cancel=false}={}){
 const state={challenge:null,exchanges:0,start:null};
 await context.addInitScript(({signed,user})=>{localStorage.setItem('ashwi.theme','dark');if(signed){localStorage.setItem('ashwi.user',JSON.stringify(user));localStorage.setItem('ashwi.token','existing-session');}},{signed,user});
 await context.route('**/api/**',async route=>{
  const url=new URL(route.request().url());let data={success:true,data:[]};
  if(url.pathname.endsWith('/oauth/providers'))data={success:true,providers:{google:configured,github:configured}};
  if(url.pathname.endsWith('/oauth/linked'))data={success:true,data:[]};
  if(/\/oauth\/(google|github)\/(start|link)$/.test(url.pathname)){
   const body=route.request().postDataJSON();state.challenge=body.codeChallenge;state.start=url.pathname;
   assert.equal(body.redirectUri,base+'/oauth/callback');assert.match(state.challenge,/^[A-Za-z0-9_-]{43}$/);
   data={success:true,authorizationUrl:url.pathname.includes('google')?'https://accounts.google.com/o/oauth2/v2/auth?state=test':'https://github.com/login/oauth/authorize?state=test'};
  }
  if(url.pathname.endsWith('/oauth/exchange')){
   state.exchanges++;const body=route.request().postDataJSON();assert.equal(body.ticket,'t'.repeat(43));
   assert.equal(crypto.createHash('sha256').update(body.codeVerifier).digest('base64url'),state.challenge);
   data={success:true,user,token:'ashwi-oauth-session',linked:signed};
  }
  if(url.pathname.endsWith('/auth/me'))data={success:true,user};
  if(url.pathname.endsWith('/professions'))data={success:true,data:[{id:1,keyName:'assistant',label:'Assistant'}]};
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},body:JSON.stringify(data)});
 });
 for(const pattern of ['https://accounts.google.com/**','https://github.com/login/oauth/**']) await context.route(pattern,route=>route.fulfill({status:302,headers:{location:base+'/oauth/callback?'+(cancel?'error=denied':'ticket='+'t'.repeat(43))},body:''}));
 return state;
}
(async()=>{
 await fs.mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const provider of ['Google','GitHub']){
   const context=await browser.newContext({viewport:{width:provider==='Google'?390:1440,height:900}});const state=await mock(context);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/login',{timeout:90000});const button=page.getByRole('button',{name:`Continue with ${provider}`,exact:true});await button.waitFor();await button.click();
   await page.getByTestId('chat-composer').waitFor({timeout:60000});assert.equal(state.exchanges,1);assert.equal(await page.evaluate(()=>localStorage.getItem('ashwi.token')),'ashwi-oauth-session');assert(!page.url().includes('ticket'));assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(output,provider.toLowerCase()+'-signed-in.png')});await context.close();console.log('PASS '+provider+' browser round-trip, app proof and session storage');
  }
  const context=await browser.newContext();const state=await mock(context,{signed:true});const page=await context.newPage();await page.goto(base+'/chat');await page.getByRole('button',{name:'Open settings',exact:true}).click();await page.getByRole('button',{name:'Connect GitHub',exact:true}).click();await page.getByTestId('chat-composer').waitFor({timeout:60000});await page.waitForFunction(()=>localStorage.getItem('ashwi.token')==='ashwi-oauth-session');assert.equal(state.start,'/api/auth/oauth/github/link');assert.equal(state.exchanges,1);await context.close();console.log('PASS authenticated account linking');
  const cancelled=await browser.newContext();const denied=await mock(cancelled,{cancel:true});const cp=await cancelled.newPage();await cp.goto(base+'/login');await cp.getByRole('button',{name:'Continue with Google',exact:true}).click();await cp.getByText('Sign-in was cancelled. You can try again.',{exact:true}).waitFor();assert.equal(denied.exchanges,0);await cancelled.close();console.log('PASS provider cancellation');
  const missing=await browser.newContext();await mock(missing);const mp=await missing.newPage();await mp.goto(base+'/oauth/callback?ticket='+'t'.repeat(43));await mp.getByText('This sign-in session expired. Please start again.',{exact:true}).waitFor();await missing.close();console.log('PASS missing local proof');
  const unavailable=await browser.newContext();await mock(unavailable,{configured:false});const up=await unavailable.newPage();await up.goto(base+'/login');await up.getByText('Social sign-in needs server configuration.',{exact:true}).waitFor();assert(await up.getByRole('button',{name:'Continue with Google',exact:true}).isDisabled());await unavailable.close();console.log('PASS unconfigured provider feedback');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
