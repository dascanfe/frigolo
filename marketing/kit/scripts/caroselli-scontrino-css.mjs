// CSS comune dei caroselli e delle storie dello scontrino (L1, ST7, C9)
export const CSS = `
.sc { position:absolute; border-radius:44px; overflow:hidden; box-shadow:0 30px 60px rgba(40,20,10,.35) }
.sc img { display:block; width:100%; height:100% }
.cr { position:absolute; overflow:hidden; box-shadow:0 22px 44px rgba(40,20,10,.28) }
.cr img { position:absolute; left:0 }
.badge { position:absolute; width:58px; height:58px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-weight:700; font-size:36px; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 0 rgba(0,0,0,.2) }
.evid { position:absolute; border:6px solid var(--brick); background:rgba(176,46,80,.14); border-radius:14px }
.chip { position:absolute; left:80px; right:80px; display:flex; align-items:center; gap:24px; background:#fffaf2; color:var(--ink); border-radius:999px; padding:14px 34px 14px 16px; font-weight:900; font-size:37px; box-shadow:0 8px 0 rgba(58,44,33,.1) }
.chip .n { flex:none; width:60px; height:60px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-size:36px; display:flex; align-items:center; justify-content:center }
.chip small { font-weight:700; opacity:.7 }
.tile6 { position:absolute; width:310px; height:400px; border-radius:30px; overflow:hidden; box-shadow:0 14px 30px rgba(20,60,50,.25) }
.tile6 img { width:100%; display:block }
.tile6 span { position:absolute; left:0; right:0; bottom:0; padding:0; left:50%; right:auto; transform:translateX(-50%); bottom:14px; padding:6px 24px; border-radius:999px; text-align:center; font-weight:900; font-size:28px; color:var(--ink); background:var(--cream) }
.ph { position:absolute; width:290px; height:540px; border:11px solid #2a1219; border-radius:46px; overflow:hidden; background:#faf3ec; box-shadow:0 22px 40px rgba(40,10,20,.25) }
.ph img { position:absolute; left:0; width:100% }
.ring { position:absolute; border:6px solid var(--brick); border-radius:50px; background:rgba(176,46,80,.16) }
.cap { position:absolute; width:300px; text-align:center; font-weight:900; font-size:35px; line-height:1.2; color:var(--ink) }
.cap em { font-family:var(--font-display); font-style:italic; color:var(--brick) }
.cap .n { display:block; margin:0 auto 12px; width:56px; height:56px; border-radius:50%; background:var(--brick); color:#fff; font-family:var(--font-display); font-size:34px; line-height:56px }
.pillb { position:absolute; font-weight:900; font-size:30px; padding:10px 28px; border-radius:999px; background:var(--cream); color:var(--ink); white-space:nowrap; box-shadow:0 6px 0 rgba(0,0,0,.12) }
`
