const fs = require('fs');
const path = require('path');

const OUT = __dirname;

// App Store Connect screenshot sizes
const SIZES = {
  // iPhone 6.5" (1242x2688) — required by App Store Connect
  'iphone-6.5': { w: 1242, h: 2688 },
};

function makeHtml(title, headline, subtext, phoneContent, size, bg = 'linear-gradient(160deg,#1a2f27 0%,#2D4A3E 45%,#1e3830 100%)') {
  const scale = size.w / 1290; // scale relative to base 6.7" design
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${size.w}">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:${size.w}px;height:${size.h}px;
  background:${bg};
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  overflow:hidden;position:relative;color:#fff;
}
.headline{font-size:${Math.round(72*scale)}px;font-weight:800;text-align:center;line-height:1.1;margin-bottom:${Math.round(24*scale)}px;padding:0 ${Math.round(60*scale)}px;letter-spacing:-1px}
.sub{font-size:${Math.round(40*scale)}px;font-weight:400;text-align:center;opacity:.75;margin-bottom:${Math.round(60*scale)}px;padding:0 ${Math.round(80*scale)}px}
.phone{
  width:${Math.round(580*scale)}px;height:${Math.round(1260*scale)}px;
  background:#0d1a14;
  border-radius:${Math.round(60*scale)}px;
  border:${Math.round(10*scale)}px solid rgba(255,255,255,0.15);
  box-shadow:0 ${Math.round(40*scale)}px ${Math.round(120*scale)}px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);
  overflow:hidden;position:relative;
  display:flex;flex-direction:column;
}
.notch{width:${Math.round(130*scale)}px;height:${Math.round(34*scale)}px;background:#000;border-radius:0 0 ${Math.round(20*scale)}px ${Math.round(20*scale)}px;position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:10}
.screen{flex:1;padding:${Math.round(50*scale)}px ${Math.round(30*scale)}px ${Math.round(30*scale)}px;display:flex;flex-direction:column;overflow:hidden}
.badge{display:inline-block;background:rgba(100,200,140,0.2);border:1px solid rgba(100,200,140,0.4);color:#64c88c;border-radius:20px;padding:8px 24px;font-size:${Math.round(28*scale)}px;font-weight:600;margin-bottom:${Math.round(40*scale)}px;text-align:center;align-self:center}
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

function makeScreen1Html(size) {
  const scale = size.w / 1290;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${size.w}">
<title>Therapy Binder – Screen 1</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${size.w}px; height: ${size.h}px;
    background: linear-gradient(160deg, #1a2f27 0%, #2D4A3E 45%, #1e3830 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }
  body::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(100, 200, 140, 0.12) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(45, 74, 62, 0.4) 0%, transparent 60%);
    pointer-events: none;
  }
  .layout { display: flex; flex-direction: column; align-items: center; gap: ${Math.round(80*scale)}px; position: relative; z-index: 1; }
  .headline { text-align: center; }
  .headline h1 { font-size: ${Math.round(96*scale)}px; font-weight: 700; color: #ffffff; letter-spacing: -2px; line-height: 1.05; text-shadow: 0 2px 40px rgba(0,0,0,0.3); }
  .headline h1 em { font-style: normal; color: #7DCEA0; }
  .headline p { font-size: ${Math.round(42*scale)}px; color: rgba(255,255,255,0.65); margin-top: ${Math.round(20*scale)}px; font-weight: 400; }
  .phone {
    width: ${Math.round(640*scale)}px; height: ${Math.round(1340*scale)}px;
    background: #0d1a14; border-radius: ${Math.round(80*scale)}px;
    border: ${Math.round(10*scale)}px solid #3a5a4e;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.06), 0 ${Math.round(60*scale)}px ${Math.round(120*scale)}px rgba(0,0,0,0.7);
    overflow: hidden; position: relative;
  }
  .dynamic-island { position: absolute; top: ${Math.round(18*scale)}px; left: 50%; transform: translateX(-50%); width: ${Math.round(130*scale)}px; height: ${Math.round(38*scale)}px; background: #000; border-radius: ${Math.round(20*scale)}px; z-index: 10; }
  .screen {
    width: 100%; height: 100%;
    background: linear-gradient(180deg, #0f1f18 0%, #162b22 100%);
    display: flex; flex-direction: column; align-items: center;
    padding: ${Math.round(90*scale)}px ${Math.round(50*scale)}px ${Math.round(60*scale)}px; gap: 0;
  }
  .status-bar { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 ${Math.round(10*scale)}px; margin-bottom: ${Math.round(60*scale)}px; }
  .status-time { font-size: ${Math.round(24*scale)}px; font-weight: 600; color: #fff; }
  .status-icons { display: flex; gap: ${Math.round(12*scale)}px; align-items: center; }
  .status-icons svg { width: ${Math.round(22*scale)}px; height: ${Math.round(22*scale)}px; fill: #fff; opacity: 0.9; }
  .logo-area { display: flex; flex-direction: column; align-items: center; flex: 1; justify-content: center; gap: ${Math.round(40*scale)}px; }
  .app-icon-wrapper {
    width: ${Math.round(160*scale)}px; height: ${Math.round(160*scale)}px;
    background: linear-gradient(135deg, #2D4A3E 0%, #3d6b59 100%);
    border-radius: ${Math.round(36*scale)}px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
  }
  .lock-icon { width: ${Math.round(80*scale)}px; height: ${Math.round(80*scale)}px; color: #7DCEA0; }
  .app-name { font-size: ${Math.round(42*scale)}px; font-weight: 700; color: #fff; }
  .app-tagline { font-size: ${Math.round(22*scale)}px; color: rgba(255,255,255,0.6); text-align: center; }
  .privacy-tags { display: flex; gap: ${Math.round(14*scale)}px; flex-wrap: wrap; justify-content: center; margin-top: ${Math.round(20*scale)}px; }
  .tag { background: rgba(125, 206, 160, 0.15); border: 1px solid rgba(125, 206, 160, 0.35); border-radius: 30px; padding: ${Math.round(10*scale)}px ${Math.round(22*scale)}px; font-size: ${Math.round(20*scale)}px; color: #7DCEA0; font-weight: 500; }
  .main-tagline { text-align: center; margin-top: ${Math.round(30*scale)}px; }
  .main-tagline .big { font-size: ${Math.round(34*scale)}px; font-weight: 700; color: #fff; line-height: 1.2; }
  .main-tagline .sub { font-size: ${Math.round(20*scale)}px; color: rgba(255,255,255,0.5); margin-top: ${Math.round(10*scale)}px; }
  .cta-btn {
    width: 100%; height: ${Math.round(80*scale)}px;
    background: linear-gradient(135deg, #4CAF87 0%, #2D7A5E 100%);
    border-radius: ${Math.round(24*scale)}px;
    display: flex; align-items: center; justify-content: center;
    font-size: ${Math.round(26*scale)}px; font-weight: 700; color: #fff;
    box-shadow: 0 4px 20px rgba(76, 175, 135, 0.35); margin-top: auto;
  }
  .bottom-badge {
    display: flex; align-items: center; gap: ${Math.round(16*scale)}px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50px; padding: ${Math.round(18*scale)}px ${Math.round(40*scale)}px; margin-top: ${Math.round(20*scale)}px;
  }
  .bottom-badge svg { width: ${Math.round(32*scale)}px; height: ${Math.round(32*scale)}px; fill: #7DCEA0; }
  .bottom-badge span { font-size: ${Math.round(28*scale)}px; color: rgba(255,255,255,0.8); font-weight: 500; }
  .dots { position: absolute; top: 120px; right: -200px; width: 400px; height: 400px; opacity: 0.04; background-image: radial-gradient(circle, #fff 1.5px, transparent 1.5px); background-size: 24px 24px; border-radius: 50%; }
  .dots2 { position: absolute; bottom: 200px; left: -180px; width: 350px; height: 350px; opacity: 0.04; background-image: radial-gradient(circle, #fff 1.5px, transparent 1.5px); background-size: 24px 24px; border-radius: 50%; }
</style>
</head>
<body>
  <div class="dots"></div>
  <div class="dots2"></div>
  <div class="layout">
    <div class="headline">
      <h1>Your Private<br><em>Therapy Journal</em></h1>
      <p>A safe space that truly belongs to you</p>
    </div>
    <div class="phone-wrap">
      <div class="phone">
        <div class="dynamic-island"></div>
        <div class="screen">
          <div class="status-bar">
            <span class="status-time">9:41</span>
            <div class="status-icons">
              <svg viewBox="0 0 24 24"><rect x="1" y="14" width="3" height="7" rx="0.5"/><rect x="6" y="10" width="3" height="11" rx="0.5"/><rect x="11" y="6" width="3" height="15" rx="0.5"/><rect x="16" y="2" width="3" height="19" rx="0.5"/></svg>
              <svg viewBox="0 0 24 24"><path d="M12 18.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0-4a5 5 0 013.54 1.46l-1.42 1.42a3 3 0 00-4.24 0L8.46 15.96A5 5 0 0112 14.5zm0-4a9 9 0 016.36 2.64l-1.42 1.42A7 7 0 0012 12.5a7 7 0 00-4.95 2.06L5.63 13.14A9 9 0 0112 10.5zm0-4a13 13 0 019.19 3.81l-1.42 1.42A11 11 0 0012 8.5a11 11 0 00-7.78 3.23L2.81 10.31A13 13 0 0112 6.5z"/></svg>
              <svg viewBox="0 0 28 14"><rect x="0" y="1" width="24" height="12" rx="3" stroke="#fff" stroke-width="1.5" fill="none"/><rect x="2" y="3" width="18" height="8" rx="1.5" fill="#fff"/><path d="M25.5 4.5v5a2 2 0 000-5z"/></svg>
            </div>
          </div>
          <div class="logo-area">
            <div class="app-icon-wrapper">
              <svg class="lock-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="36" width="48" height="34" rx="8" fill="#7DCEA0" opacity="0.9"/>
                <path d="M26 36V26a14 14 0 1128 0v10" stroke="#7DCEA0" stroke-width="5" stroke-linecap="round" fill="none"/>
                <circle cx="40" cy="52" r="6" fill="#0f1f18"/>
                <rect x="38" y="52" width="4" height="8" rx="2" fill="#0f1f18"/>
              </svg>
            </div>
            <div style="text-align:center;">
              <div class="app-name">Therapy Binder</div>
              <div class="app-tagline">Private. Encrypted. Yours.</div>
            </div>
            <div class="privacy-tags">
              <div class="tag">AES-256</div>
              <div class="tag">Zero-Knowledge</div>
              <div class="tag">No Tracking</div>
            </div>
            <div class="main-tagline">
              <div class="big">Your thoughts stay<br>between you and you</div>
              <div class="sub">End-to-end encrypted on your device</div>
            </div>
          </div>
          <div class="cta-btn">Get Started Free</div>
        </div>
      </div>
    </div>
    <div class="bottom-badge">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg>
      <span>Trusted by thousands in therapy</span>
    </div>
  </div>
</body>
</html>`;
}

const screens = [
  {
    file: 'screen_2',
    title: 'Capture Every Session',
    headline: 'Capture Every Session',
    subtext: 'Write freely. Everything is private.',
    phoneContent: `
      <div style="margin-top:40px">
        <div style="font-size:22px;opacity:.5;margin-bottom:12px">Today &middot; 2:30 PM</div>
        <div style="font-size:28px;font-weight:700;margin-bottom:20px;color:#a8d5b5">Session Notes</div>
        <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:24px;margin-bottom:20px">
          <div style="display:flex;gap:12px;margin-bottom:16px">
            ${['relaxed','happy','sad','angry','anxious'].map((e,i)=>
              `<div style="width:52px;height:52px;border-radius:50%;background:${i===1?'rgba(100,200,140,0.3)':'rgba(255,255,255,0.05)'};display:flex;align-items:center;justify-content:center;font-size:26px;${i===1?'border:2px solid #64c88c':''}">${['😌','😊','😔','😤','😰'][i]}</div>`
            ).join('')}
          </div>
          <div style="font-size:22px;line-height:1.6;opacity:.85;color:#e0f0e8">
            Today we talked about the anxiety triggers from last week. I noticed the pattern — when I feel overwhelmed, I tend to withdraw instead of reaching out...
          </div>
        </div>
        <div style="background:rgba(100,200,140,0.1);border:1px solid rgba(100,200,140,0.2);border-radius:12px;padding:16px;font-size:20px;opacity:.7;color:#a8d5b5">
          AES-256 encrypted &middot; Only you can read this
        </div>
        <div style="margin-top:24px;display:flex;gap:12px">
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;font-size:20px">Goals</div>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;font-size:20px">Attach</div>
          <div style="flex:1;background:#2D4A3E;border-radius:12px;padding:16px;text-align:center;font-size:20px;color:#64c88c">Save</div>
        </div>
      </div>`
  },
  {
    file: 'screen_3',
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
          {d:'Mar 8',t:'Boundary Setting',m:'😊'},
          {d:'Mar 1',t:'Processing Grief',m:'😌'},
          {d:'Feb 22',t:'Anxiety Triggers',m:'😔'},
          {d:'Feb 15',t:'Self-Compassion',m:'😊'},
        ].map(s=>`
          <div style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.05);border-radius:14px;padding:18px;margin-bottom:12px">
            <div style="font-size:32px">${s.m}</div>
            <div style="flex:1">
              <div style="font-size:22px;font-weight:600">${s.t}</div>
              <div style="font-size:18px;opacity:.5">${s.d}</div>
            </div>
            <div style="font-size:20px;opacity:.3">&#8250;</div>
          </div>`).join('')}
      </div>`
  },
  {
    file: 'screen_4',
    title: 'Zero-Knowledge Privacy',
    headline: 'Zero-Knowledge Privacy',
    subtext: 'Even we can\'t read your journals.',
    phoneContent: `
      <div style="margin-top:20px;display:flex;flex-direction:column;align-items:center">
        <div style="font-size:120px;margin:30px 0">&#x1F510;</div>
        <div style="font-size:30px;font-weight:700;margin-bottom:12px;text-align:center">Your Data. Your Keys.</div>
        <div style="font-size:22px;opacity:.6;text-align:center;line-height:1.5;padding:0 20px;margin-bottom:32px">
          Everything is encrypted on your device before it's stored. We have zero access.
        </div>
        ${[
          {icon:'&#x1F511;',t:'AES-256-GCM Encryption',s:'Military-grade cipher'},
          {icon:'&#x1F9E0;',t:'PBKDF2 Key Derivation',s:'100k iterations'},
          {icon:'&#x1F4F1;',t:'On-Device Only',s:'Never sent to our servers'},
          {icon:'&#x1F331;',t:'24-Word Recovery Phrase',s:'You own your data forever'},
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
    file: 'screen_5',
    title: 'Unlock Unlimited Sessions',
    headline: 'Unlock Unlimited Sessions',
    subtext: '',
    phoneContent: `
      <div style="margin-top:10px">
        <div style="text-align:center;margin-bottom:20px">
          <div style="display:inline-block;background:rgba(100,200,140,0.2);border:1px solid #64c88c;color:#64c88c;border-radius:20px;padding:10px 28px;font-size:24px;font-weight:700">7-Day Free Trial</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px">
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:16px;padding:20px">
            <div style="font-size:22px;font-weight:700;margin-bottom:8px">Free</div>
            <div style="font-size:36px;font-weight:800">$0</div>
            <div style="font-size:18px;opacity:.5;margin-bottom:16px">Forever</div>
            ${['10 lifetime sessions','Basic journal','Local storage'].map(f=>`<div style="font-size:18px;opacity:.6;margin-bottom:8px">&#10003; ${f}</div>`).join('')}
          </div>
          <div style="flex:1;background:linear-gradient(135deg,rgba(100,200,140,0.2),rgba(45,74,62,0.4));border:2px solid #64c88c;border-radius:16px;padding:20px;position:relative">
            <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#64c88c;color:#1a2f27;font-size:16px;font-weight:800;padding:4px 16px;border-radius:10px;white-space:nowrap">MOST POPULAR</div>
            <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#64c88c">Pro</div>
            <div style="font-size:36px;font-weight:800">$9.99</div>
            <div style="font-size:18px;opacity:.5;margin-bottom:4px">/month</div>
            <div style="font-size:16px;color:#64c88c;margin-bottom:12px">or $59.99/yr &middot; Save 50%</div>
            ${['Unlimited sessions','Full encryption','Export & backup','Priority support'].map(f=>`<div style="font-size:18px;color:#a8d5b5;margin-bottom:8px">&#10003; ${f}</div>`).join('')}
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#2D4A3E,#1e3830);border-radius:14px;padding:20px;text-align:center;font-size:26px;font-weight:700;color:#64c88c">
          Start Free Trial &rarr;
        </div>
      </div>`
  }
];

// Generate HTML files for all sizes
Object.entries(SIZES).forEach(([sizeName, size]) => {
  const dir = path.join(OUT, sizeName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Screen 1 (hero/onboarding)
  const screen1 = makeScreen1Html(size);
  fs.writeFileSync(path.join(dir, 'screen_1.html'), screen1);
  console.log(`  ${sizeName}/screen_1.html`);

  // Screens 2-5
  screens.forEach(s => {
    const html = makeHtml(s.title, s.headline, s.subtext, s.phoneContent, size);
    fs.writeFileSync(path.join(dir, `${s.file}.html`), html);
    console.log(`  ${sizeName}/${s.file}.html`);
  });

  console.log(`✓ ${sizeName} (${size.w}x${size.h}) — 5 screens\n`);
});

console.log('Done! Now run: node render-screenshots.js');
