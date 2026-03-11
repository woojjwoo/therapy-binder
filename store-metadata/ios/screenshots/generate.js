const fs = require('fs');
const path = require('path');

const OUT = __dirname;

function makeHtml(title, headline, subtext, phoneContent, bg = 'linear-gradient(160deg,#1a2f27 0%,#2D4A3E 45%,#1e3830 100%)') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1290">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:1290px;height:2796px;
  background:${bg};
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  overflow:hidden;position:relative;color:#fff;
}
.headline{font-size:72px;font-weight:800;text-align:center;line-height:1.1;margin-bottom:24px;padding:0 60px;letter-spacing:-1px}
.sub{font-size:40px;font-weight:400;text-align:center;opacity:.75;margin-bottom:60px;padding:0 80px}
.phone{
  width:580px;height:1260px;
  background:#0d1a14;
  border-radius:60px;
  border:10px solid rgba(255,255,255,0.15);
  box-shadow:0 40px 120px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);
  overflow:hidden;position:relative;
  display:flex;flex-direction:column;
}
.notch{width:130px;height:34px;background:#000;border-radius:0 0 20px 20px;margin:0 auto 0;position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:10}
.screen{flex:1;padding:50px 30px 30px;display:flex;flex-direction:column;overflow:hidden}
.badge{display:inline-block;background:rgba(100,200,140,0.2);border:1px solid rgba(100,200,140,0.4);color:#64c88c;border-radius:20px;padding:8px 24px;font-size:28px;font-weight:600;margin-bottom:40px;text-align:center;align-self:center}
</style>
</head>
<body>
<div class="headline">${headline}</div>
${subtext ? `<div class="sub">${subtext}</div>` : ''}
<div class="phone">
  <div class="notch"></div>
  <div class="screen">${phoneContent}</div>
</div>
</body>
</html>`;
}

const screens = [
  {
    file: 'screen_2.html',
    title: 'Capture Every Session',
    headline: 'Capture Every Session',
    subtext: 'Write freely. Everything is private.',
    phoneContent: `
      <div style="margin-top:40px">
        <div style="font-size:22px;opacity:.5;margin-bottom:12px">Today · 2:30 PM</div>
        <div style="font-size:28px;font-weight:700;margin-bottom:20px;color:#a8d5b5">Session Notes</div>
        <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:24px;margin-bottom:20px">
          <div style="display:flex;gap:12px;margin-bottom:16px">
            ${['😌','😊','😔','😤','😰'].map((e,i)=>
              `<div style="width:52px;height:52px;border-radius:50%;background:${i===1?'rgba(100,200,140,0.3)':'rgba(255,255,255,0.05)'};display:flex;align-items:center;justify-content:center;font-size:26px;${i===1?'border:2px solid #64c88c':''}">${e}</div>`
            ).join('')}
          </div>
          <div style="font-size:22px;line-height:1.6;opacity:.85;color:#e0f0e8">
            Today we talked about the anxiety triggers from last week. I noticed the pattern — when I feel overwhelmed, I tend to withdraw instead of reaching out...
          </div>
        </div>
        <div style="background:rgba(100,200,140,0.1);border:1px solid rgba(100,200,140,0.2);border-radius:12px;padding:16px;font-size:20px;opacity:.7;color:#a8d5b5">
          🔒 AES-256 encrypted · Only you can read this
        </div>
        <div style="margin-top:24px;display:flex;gap:12px">
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;font-size:20px">🎯 Goals</div>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;font-size:20px">📎 Attach</div>
          <div style="flex:1;background:#2D4A3E;border-radius:12px;padding:16px;text-align:center;font-size:20px;color:#64c88c">💾 Save</div>
        </div>
      </div>`
  },
  {
    file: 'screen_3.html',
    title: 'See How Far You\'ve Come',
    headline: "See How Far You've Come",
    subtext: 'Track every session, every breakthrough.',
    phoneContent: `
      <div style="margin-top:20px">
        <div style="font-size:28px;font-weight:700;margin-bottom:20px">Session History</div>
        <div style="display:flex;gap:16px;margin-bottom:24px">
          <div style="flex:1;background:rgba(100,200,140,0.15);border-radius:16px;padding:20px;text-align:center">
            <div style="font-size:48px;font-weight:800;color:#64c88c">24</div>
            <div style="font-size:18px;opacity:.6">Sessions</div>
          </div>
          <div style="flex:1;background:rgba(100,200,140,0.15);border-radius:16px;padding:20px;text-align:center">
            <div style="font-size:48px;font-weight:800;color:#64c88c">8</div>
            <div style="font-size:18px;opacity:.6">Weeks</div>
          </div>
          <div style="flex:1;background:rgba(100,200,140,0.15);border-radius:16px;padding:20px;text-align:center">
            <div style="font-size:48px;font-weight:800;color:#64c88c">😊</div>
            <div style="font-size:18px;opacity:.6">Avg Mood</div>
          </div>
        </div>
        ${[
          {d:'Mar 8',t:'Boundary Setting',m:'😊',p:true},
          {d:'Mar 1',t:'Processing Grief',m:'😌',p:true},
          {d:'Feb 22',t:'Anxiety Triggers',m:'😔',p:true},
          {d:'Feb 15',t:'Self-Compassion',m:'😊',p:true},
        ].map(s=>`
          <div style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.05);border-radius:14px;padding:18px;margin-bottom:12px">
            <div style="font-size:32px">${s.m}</div>
            <div style="flex:1">
              <div style="font-size:22px;font-weight:600">${s.t}</div>
              <div style="font-size:18px;opacity:.5">${s.d}</div>
            </div>
            <div style="font-size:20px;opacity:.3">›</div>
          </div>`).join('')}
      </div>`
  },
  {
    file: 'screen_4.html',
    title: 'Zero-Knowledge Privacy',
    headline: 'Zero-Knowledge Privacy',
    subtext: 'Even we can\'t read your journals.',
    phoneContent: `
      <div style="margin-top:20px;display:flex;flex-direction:column;align-items:center">
        <div style="font-size:120px;margin:30px 0">🔐</div>
        <div style="font-size:30px;font-weight:700;margin-bottom:12px;text-align:center">Your Data. Your Keys.</div>
        <div style="font-size:22px;opacity:.6;text-align:center;line-height:1.5;padding:0 20px;margin-bottom:32px">
          Everything is encrypted on your device before it's stored. We have zero access.
        </div>
        ${[
          {icon:'🔑',t:'AES-256-GCM Encryption',s:'Military-grade cipher'},
          {icon:'🧠',t:'PBKDF2 Key Derivation',s:'100k iterations'},
          {icon:'📱',t:'On-Device Only',s:'Never sent to our servers'},
          {icon:'🌱',t:'24-Word Recovery Phrase',s:'You own your data forever'},
        ].map(f=>`
          <div style="display:flex;align-items:center;gap:16px;background:rgba(100,200,140,0.08);border:1px solid rgba(100,200,140,0.15);border-radius:14px;padding:18px;margin-bottom:12px;width:100%">
            <div style="font-size:32px;width:50px;text-align:center">${f.icon}</div>
            <div>
              <div style="font-size:22px;font-weight:600">${f.t}</div>
              <div style="font-size:18px;opacity:.5;color:#a8d5b5">${f.s}</div>
            </div>
          </div>`).join('')}
      </div>`
  },
  {
    file: 'screen_5.html',
    title: 'Unlock Unlimited Sessions',
    headline: 'Unlock Unlimited Sessions',
    subtext: '',
    phoneContent: `
      <div style="margin-top:10px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="display:inline-block;background:rgba(100,200,140,0.2);border:1px solid #64c88c;color:#64c88c;border-radius:20px;padding:10px 28px;font-size:24px;font-weight:700">✨ 7-Day Free Trial</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px">
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:16px;padding:20px">
            <div style="font-size:22px;font-weight:700;margin-bottom:8px">Free</div>
            <div style="font-size:36px;font-weight:800">$0</div>
            <div style="font-size:18px;opacity:.5;margin-bottom:16px">Forever</div>
            ${['10 lifetime sessions','Basic journal','Local storage'].map(f=>`<div style="font-size:18px;opacity:.6;margin-bottom:8px">✓ ${f}</div>`).join('')}
          </div>
          <div style="flex:1;background:linear-gradient(135deg,rgba(100,200,140,0.2),rgba(45,74,62,0.4));border:2px solid #64c88c;border-radius:16px;padding:20px;position:relative">
            <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#64c88c;color:#1a2f27;font-size:16px;font-weight:800;padding:4px 16px;border-radius:10px;white-space:nowrap">MOST POPULAR</div>
            <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#64c88c">Pro</div>
            <div style="font-size:36px;font-weight:800">$9.99</div>
            <div style="font-size:18px;opacity:.5;margin-bottom:4px">/month</div>
            <div style="font-size:16px;color:#64c88c;margin-bottom:12px">or $59.99/yr · Save 50%</div>
            ${['Unlimited sessions','Full encryption','Export & backup','Priority support'].map(f=>`<div style="font-size:18px;color:#a8d5b5;margin-bottom:8px">✓ ${f}</div>`).join('')}
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#2D4A3E,#1e3830);border-radius:14px;padding:20px;text-align:center;font-size:26px;font-weight:700;color:#64c88c">
          Start Free Trial →
        </div>
      </div>`
  }
];

screens.forEach(s => {
  const html = makeHtml(s.title, s.headline, s.subtext, s.phoneContent);
  const outPath = path.join(OUT, s.file);
  fs.writeFileSync(outPath, html);
  console.log(`✓ ${s.file}`);
});
console.log('Done!');
