const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = path.join(__dirname, '..', 'test-artifacts', 'redesign');
const theme = process.argv[2] || 'dark';
const now = '2026-11-03T10:00:00Z';
const user = { id: 'design-test', name: 'Design Reviewer', email: 'reviewer@example.invalid', role: 'admin', isVerified: true };

async function mockApp(context, signedIn, theme) {
  await context.addInitScript(({ user, signedIn, theme }) => {
    localStorage.setItem('theme', theme); localStorage.setItem('ashwi.theme', theme);
    if (signedIn) for (const [key,value] of [['user',JSON.stringify(user)],['token','design-test-token'],['ashwi.user',JSON.stringify(user)],['ashwi.token','design-test-token']]) localStorage.setItem(key,value);
  }, { user, signedIn, theme });
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data = [];
    if (url.pathname.endsWith('/professions')) data = [{ id: '1', keyName: 'assistant', label: 'Assistant' }, {id:'2', keyName:'engineer', label:'Software Engineer'}];
    if (url.pathname.endsWith('/sessions')) data = Array.from({length:10},(_,i)=>({session_id:`session-${i}`,title:`React component refactor ${i+1}`,message_count:2,last_message_at:now,first_message_at:now}));
    if (url.pathname.endsWith('/history')) data = [{id:'1',session_id:'session-0',persona_role:'assistant',profession_key:'assistant',user_message:'Can you help me refactor this React component?',ai_response:'Memoize the component and keep its event handlers stable.\n\n```javascript\nconst onSelect = useCallback((item) => {\n  setSelected(item.id);\n}, []);\n```',created_at:now}];
    if (url.pathname.endsWith('/dashboard')) data={totalUsers:1240,activeUsers:842,totalChats:4200,totalLogs:24000};
    if (url.pathname.endsWith('/activity-summary')) data={last24hChats:324,last24hLogs:408,topActions:[{action:'USER_LOGIN',count:32},{action:'CHAT_MESSAGE_SENT',count:98},{action:'PROFILE_UPDATED',count:14},{action:'USER_SIGNUP',count:48}],recentActivity:[{id:'1',action:'CHAT_MESSAGE_SENT',user_email:user.email,created_at:now},{id:'2',action:'USER_LOGIN',user_email:user.email,created_at:now}]};
    if (url.pathname.endsWith('/users')) data=[{id:'member-1',email:'member@example.invalid',name:'Team Member',role:'user',is_active:true,is_verified:true}];
    if (url.pathname.endsWith('/chats')) data=[{id:'chat-1',user_email:user.email,user_message:'Explain React memoization.',ai_response:'Memoization reuses the result of a previous calculation.',created_at:now,persona_role:'engineer',session_id:'session-0'}];
    if (url.pathname.endsWith('/logs')) data=[{id:'log-1',action:'USER_LOGIN',created_at:now,user_email:user.email,details:{source:'design-test'}}];
    const body = url.pathname.endsWith('/auth/me') ? {success:true,user} : {success:true,data,pagination:{total:1,totalPages:1,page:1,limit:25}};
    await route.fulfill({ status:200, contentType:'application/json', headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}, body:JSON.stringify(body) });
  });
}

async function verify(page,label) {
  const issues=await page.evaluate(()=>{
    const issues=[];
    if(document.documentElement.scrollWidth>innerWidth+1) issues.push(`document ${document.documentElement.scrollWidth}>${innerWidth}`);
    for(const el of document.querySelectorAll('input,textarea,button,[role="button"],[data-testid="auth-form"],[data-testid="chat-composer"]')){
      const r=el.getBoundingClientRect();
      // Off-canvas drawers and horizontally scrollable toolbars are intentional.
      if(!r.width||!r.height||r.right<=0||r.left>=innerWidth) continue;
      if(r.left < -1 || r.right>innerWidth+1) issues.push(`${el.getAttribute('aria-label')||el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return issues;
  });
  if(issues.length) await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});
  assert.deepEqual(issues,[],label);
}

async function main(){
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const report=[];
  try {
    for(const app of [{name:'unified',url:process.env.PREVIEW_URL || 'http://localhost:3000',admin:'/admin/users',overview:'/admin'}]){
      for(const viewport of [{width:320,height:720},{width:360,height:800},{width:768,height:1024},{width:1440,height:1000}]){
        const errors=[];
        const guest=await browser.newContext({viewport});await mockApp(guest,false,theme);const page=await guest.newPage();page.on('pageerror',e=>errors.push(e.message));
        for(const route of ['/','/login','/signup','/forgot-password','/reset-password','/about']){
          await page.goto(app.url+route,{waitUntil:'domcontentloaded',timeout:90000});
          if(route==='/') await page.getByText('Less switching. More thinking.',{exact:true}).waitFor({timeout:60000});
          else if(route==='/about') await page.getByText('The Future of Orchestrated Intelligence',{exact:true}).waitFor({timeout:60000});
          else await page.getByText('About Ashwi',{exact:true}).first().waitFor({state:'attached',timeout:60000});
          if(route==='/login') await page.getByLabel('Work email',{exact:true}).waitFor({timeout:60000});
          if(route==='/signup') await page.getByLabel('Full name',{exact:true}).waitFor({timeout:60000});
          await page.evaluate(()=>document.fonts.ready);
          await verify(page,`${app.name} ${route} ${viewport.width}`);
          await page.screenshot({path:path.join(output,`${theme==='light'?'light-':''}${app.name}-${route.slice(1)||'home'}-${viewport.width}.png`),fullPage:true});
        }
        await guest.close();
        const signed=await browser.newContext({viewport});await mockApp(signed,true,theme);const chat=await signed.newPage();chat.on('pageerror',e=>errors.push(e.message));
        for(const route of ['/chat/history',app.admin,app.overview]){
          await chat.goto(app.url+route,{waitUntil:'domcontentloaded',timeout:90000});
          if(route==='/chat/history') {
            await chat.getByText('Can you help me refactor this React component?',{exact:true}).waitFor({timeout:60000});
          }
          else await chat.getByText(route===app.admin?'User Management':'Admin Overview',{exact:true}).first().waitFor({timeout:60000});
          await verify(chat,`${app.name} ${route} ${viewport.width}`);
          await chat.screenshot({path:path.join(output,`${theme==='light'?'light-':''}${app.name}-${route==='/chat/history'?'chat':route===app.admin?'users':'admin'}-${viewport.width}.png`),fullPage:true});
        }
        await chat.goto(app.url+'/chat');
        if(viewport.width===360){
          await chat.getByRole('button',{name:'Open navigation',exact:true}).click();
          await chat.getByText('Settings',{exact:true}).last().waitFor();
          await verify(chat,`${app.name} mobile drawer`);
        }
        assert.deepEqual(errors,[],`${app.name} runtime errors`);
        await signed.close();
        report.push({app:app.name,...viewport,status:'passed'});
        console.log(`PASS ${app.name} ${viewport.width}: auth, marketing, chat, admin and navigation`);
      }
    }
    await fs.writeFile(path.join(output,`unified-${theme}-report.json`),JSON.stringify(report,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
