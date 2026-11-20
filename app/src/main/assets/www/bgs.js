'use strict';
/* Backgrounds: static gradients, patterns, dark themes and animated scenes. */
(function () {
  const svg = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const X = 'xmlns="http://www.w3.org/2000/svg"';

  // ---------- pattern tiles ----------
  const P = {
    leaf: `<svg ${X} width="120" height="120" viewBox="0 0 120 120"><g fill="none" stroke="#9CC3A4" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M20 50c0-16 10-28 30-30-2 20-14 30-30 30z"/><path d="M20 50l16-16"/><path d="M80 110c0-14 9-24 26-26-2 17-12 26-26 26z"/><path d="M80 110l14-14"/></g><g fill="#F2C38B" opacity=".5"><circle cx="90" cy="30" r="4"/><circle cx="40" cy="95" r="3"/></g></svg>`,
    fruit: `<svg ${X} width="140" height="140" viewBox="0 0 140 140"><g opacity=".5"><circle cx="30" cy="34" r="14" fill="#F6B26B"/><circle cx="30" cy="34" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M30 25v18M21 34h18" stroke="#fff" stroke-width="1.5"/><circle cx="102" cy="96" r="12" fill="#E06666"/><path d="M102 84c2-5 6-6 9-6" stroke="#6AA84F" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="104" cy="30" rx="9" ry="13" fill="#93C47D" transform="rotate(30 104 30)"/><circle cx="40" cy="108" r="6" fill="#B4A7D6"/><circle cx="50" cy="104" r="6" fill="#B4A7D6"/><circle cx="45" cy="114" r="6" fill="#B4A7D6"/></g></svg>`,
    wave: `<svg ${X} width="160" height="60" viewBox="0 0 160 60"><path d="M0 30c20-14 60-14 80 0s60 14 80 0" fill="none" stroke="#9FC9DA" stroke-width="2" opacity=".6"/></svg>`,
    waves2: `<svg ${X} width="80" height="40" viewBox="0 0 80 40"><path d="M0 20q10-10 20 0t20 0 20 0 20 0" fill="none" stroke="#F0B9A7" stroke-width="2"/><path d="M0 36q10-10 20 0t20 0 20 0 20 0" fill="none" stroke="#F7D6B8" stroke-width="2"/></svg>`,
    tri: `<svg ${X} width="60" height="52" viewBox="0 0 60 52"><path d="M30 4l24 42H6z" fill="none" stroke="#B9C7E6" stroke-width="1.6" opacity=".8"/><circle cx="30" cy="32" r="2.5" fill="#F2A7B5"/></svg>`,
    hex: `<svg ${X} width="56" height="98" viewBox="0 0 56 98"><path d="M28 66L0 50V18L28 2l28 16v32zM28 98V66" fill="none" stroke="#E7C873" stroke-width="1.5" opacity=".7"/></svg>`,
    confetti: `<svg ${X} width="120" height="120" viewBox="0 0 120 120"><g stroke-linecap="round" stroke-width="4"><path d="M14 20l8 6" stroke="#F28B82"/><path d="M70 14l-4 9" stroke="#81C995"/><path d="M100 50l9-3" stroke="#78A9F2"/><path d="M30 80l3 9" stroke="#FDD663"/><path d="M80 96l8 5" stroke="#C58AF9"/><path d="M52 52l-7 4" stroke="#F6AEA9"/></g><g fill="#FDD663"><circle cx="100" cy="100" r="3"/><circle cx="20" cy="110" r="2.5" fill="#78A9F2"/><circle cx="60" cy="30" r="2" fill="#F28B82"/></g></svg>`,
    gingham: `<svg ${X} width="40" height="40"><rect width="40" height="40" fill="#FFF7F2"/><rect width="20" height="40" fill="#F6C9C3" opacity=".5"/><rect width="40" height="20" fill="#F6C9C3" opacity=".5"/></svg>`,
  };

  const LIST = [
    // ---------- light: soft colors ----------
    { id: 'plain', name: 'ללא', cat: 'light', css: '' },
    { id: 'sage', name: 'מרווה', cat: 'light', css: 'linear-gradient(160deg,#E2EEE1 0%,#F4F1E6 100%)' },
    { id: 'sunrise', name: 'זריחה', cat: 'light', css: 'linear-gradient(165deg,#FFE1C4 0%,#FBD2D8 50%,#E6DEF7 100%)' },
    { id: 'lavender', name: 'לבנדר', cat: 'light', css: 'linear-gradient(160deg,#E9E2F6 0%,#F8F2F6 100%)' },
    { id: 'peach', name: 'אפרסק', cat: 'light', css: 'linear-gradient(170deg,#FFD9C2 0%,#FFEFE3 55%,#FFF8F0 100%)' },
    { id: 'mint', name: 'מנטה', cat: 'light', css: 'linear-gradient(160deg,#CFF3E4 0%,#EAFBF4 60%,#F8FFFC 100%)' },
    { id: 'sky', name: 'שמיים', cat: 'light', css: 'linear-gradient(180deg,#BFE3FF 0%,#E4F3FF 50%,#FFFFFF 100%)' },
    { id: 'citrus', name: 'הדרים', cat: 'light', css: 'linear-gradient(150deg,#FFF3B0 0%,#FFE0A3 45%,#D9F5C5 100%)' },
    { id: 'berry', name: 'פירות יער', cat: 'light', css: 'linear-gradient(160deg,#F8D3E6 0%,#E4D4F7 55%,#D3E0FB 100%)' },
    { id: 'cotton', name: 'צמר גפן', cat: 'light', css: 'linear-gradient(135deg,#FFD6E8 0%,#D7E9FF 100%)' },
    { id: 'sand', name: 'חול', cat: 'light', css: 'linear-gradient(170deg,#F3E7D3 0%,#FAF4EA 100%)' },
    { id: 'pastel', name: 'פסטל', cat: 'light', css: 'radial-gradient(at 15% 10%,#FFD1DC 0,transparent 45%),radial-gradient(at 85% 20%,#C9E7FF 0,transparent 45%),radial-gradient(at 50% 90%,#D8F5D0 0,transparent 50%),#FFF9F4' },
    { id: 'tropic', name: 'טרופי', cat: 'light', css: 'radial-gradient(at 0% 0%,#FFE29A 0,transparent 50%),radial-gradient(at 100% 30%,#9EF0D2 0,transparent 50%),radial-gradient(at 30% 100%,#FFB4A2 0,transparent 55%),#FFF7EC' },
    { id: 'holo', name: 'הולוגרמה', cat: 'light', css: 'conic-gradient(from 210deg at 70% 30%,#E9D7FF,#CFF1FF,#D9FFE9,#FFF3C9,#FFD9EC,#E9D7FF)' },
    { id: 'pearl', name: 'פנינה', cat: 'light', css: 'radial-gradient(circle at 30% 20%,#FFFFFF 0,#EEF0F6 40%,#E3E6EF 100%)' },
    // ---------- patterns ----------
    { id: 'sea', name: 'ים', cat: 'pattern', css: `${svg(P.wave)} 0 0/160px 60px, linear-gradient(170deg,#CDE7F2 0%,#EAF4F1 60%,#F7F1E6 100%)` },
    { id: 'leaves', name: 'עלים', cat: 'pattern', css: `${svg(P.leaf)} 0 0/120px 120px, linear-gradient(170deg,#EEF4EA,#F7F5EE)` },
    { id: 'fruit', name: 'פירות', cat: 'pattern', css: `${svg(P.fruit)} 0 0/140px 140px, #FBF7F0` },
    { id: 'dots', name: 'נקודות', cat: 'pattern', css: 'radial-gradient(#CDD3C8 1.3px, transparent 1.6px) 0 0/18px 18px, #F5F6F2' },
    { id: 'grid', name: 'מחברת', cat: 'pattern', css: 'linear-gradient(#DCE4EF 1px, transparent 1px) 0 0/100% 28px, linear-gradient(90deg,#DCE4EF 1px, transparent 1px) 0 0/28px 100%, #FBFCFE' },
    { id: 'waves2', name: 'אדוות', cat: 'pattern', css: `${svg(P.waves2)} 0 0/80px 40px, #FFF6EF` },
    { id: 'tri', name: 'משולשים', cat: 'pattern', css: `${svg(P.tri)} 0 0/60px 52px, linear-gradient(170deg,#F2F5FD,#FBF4F7)` },
    { id: 'hex', name: 'כוורת', cat: 'pattern', css: `${svg(P.hex)} 0 0/56px 98px, #FFFBEF` },
    { id: 'confetti', name: 'קונפטי', cat: 'pattern', css: `${svg(P.confetti)} 0 0/120px 120px, #FFFDF8` },
    { id: 'gingham', name: 'פיקניק', cat: 'pattern', css: `${svg(P.gingham)} 0 0/28px 28px` },
    // ---------- dark ----------
    { id: 'forest', name: 'יער', cat: 'dark', dark: true, css: 'radial-gradient(circle at 80% 0%,#2F5A45 0%,#152A22 60%,#0D1A15 100%)' },
    { id: 'night', name: 'לילה', cat: 'dark', dark: true, css: 'radial-gradient(circle at 20% 10%,#34405F 0%,#151B2B 60%,#0E121C 100%)' },
    { id: 'dusk', name: 'שקיעה', cat: 'dark', dark: true, css: 'linear-gradient(180deg,#2B2C5A 0%,#7B3F6E 50%,#E08A5A 100%)' },
    { id: 'midnight', name: 'חצות', cat: 'dark', dark: true, css: 'radial-gradient(at 20% 20%,#2A3C8F 0,transparent 50%),radial-gradient(at 80% 70%,#5B2A86 0,transparent 50%),#0B1026' },
    { id: 'espresso', name: 'אספרסו', cat: 'dark', dark: true, css: 'radial-gradient(circle at 70% 10%,#6B4A33 0%,#2E2019 55%,#1A120E 100%)' },
    { id: 'neon', name: 'ניאון', cat: 'dark', dark: true, css: 'radial-gradient(at 10% 90%,#FF2E9A55 0,transparent 45%),radial-gradient(at 90% 10%,#00E5FF55 0,transparent 45%),#0D0B1A' },
    { id: 'deep', name: 'מעמקים', cat: 'dark', dark: true, css: 'linear-gradient(180deg,#0E3A4F 0%,#0A2433 55%,#06141D 100%)' },
    { id: 'aubergine', name: 'חציל', cat: 'dark', dark: true, css: 'linear-gradient(160deg,#3B1F45 0%,#24142C 60%,#140B19 100%)' },
    // ---------- animated ----------
    { id: 'a-flow', name: 'גרדיאנט זורם', cat: 'anim', fx: 'flow', css: '#FFE8EF' },
    { id: 'a-lava', name: 'מנורת לבה', cat: 'anim', fx: 'lava', css: '#FFF5EE' },
    { id: 'a-bubbles', name: 'בועות', cat: 'anim', fx: 'bubbles', css: 'linear-gradient(180deg,#BDE6FF 0%,#E5F5FF 60%,#F7FCFF 100%)' },
    { id: 'a-seawave', name: 'גלי ים', cat: 'anim', fx: 'seawave', css: 'linear-gradient(180deg,#FFF3E0 0%,#FFE3C4 45%,#BFE7F2 100%)' },
    { id: 'a-fruit', name: 'פירות מרחפים', cat: 'anim', fx: 'fruit', css: 'linear-gradient(170deg,#FFF6E8,#F3FAEE)' },
    { id: 'a-leaves', name: 'עלים נושרים', cat: 'anim', fx: 'leaves', css: 'linear-gradient(170deg,#F6EEDC,#EEF3E2)' },
    { id: 'a-aurora', name: 'זוהר צפוני', cat: 'anim', fx: 'aurora', dark: true, css: '#071225' },
    { id: 'a-stars', name: 'שמי כוכבים', cat: 'anim', fx: 'stars', dark: true, css: 'radial-gradient(circle at 50% 120%,#24365F 0%,#0C1226 55%,#05070F 100%)' },
    { id: 'a-snow', name: 'שלג', cat: 'anim', fx: 'snow', dark: true, css: 'linear-gradient(180deg,#1B2B47 0%,#2E4A6E 100%)' },
    { id: 'a-fireflies', name: 'גחליליות', cat: 'anim', fx: 'fireflies', dark: true, css: 'radial-gradient(circle at 50% 100%,#1F3A2A 0%,#0E1C15 60%,#070F0B 100%)' },
  ];

  const CATS = [['all', 'הכל'], ['anim', 'מונפשים'], ['light', 'בהירים'], ['pattern', 'דוגמאות'], ['dark', 'כהים']];

  // seeded random so a scene looks the same every time
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const r2 = (n) => Math.round(n * 100) / 100;

  const LEAF = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 20C4 11 10 4 21 3c-1 11-7 17-17 17z" fill="currentColor"/><path d="M4 20l9-9" stroke="rgba(0,0,0,.2)" stroke-width="1.4" fill="none"/></svg>';
  const FRUITS = [
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="13" r="8" fill="#F6A04D"/><circle cx="12" cy="13" r="5.5" fill="none" stroke="#FFE2B8" stroke-width="1.4"/><path d="M12 7.5v11M6.5 13h11M8 9l8 8M16 9l-8 8" stroke="#FFE2B8" stroke-width="1"/></svg>',
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 7c-4-3-9 0-8 6 1 5 5 8 8 7 3 1 7-2 8-7 1-6-4-9-8-6z" fill="#E8574F"/><path d="M12 7c0-2 1-4 3-5" stroke="#5B8C3A" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M13 5c2-1 4 0 5 1-2 1-4 1-5-1z" fill="#7DB65A"/></svg>',
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 18c8 2 14-3 14-12-1 0-2 0-2 1-1 6-6 9-12 9z" fill="#F7D046"/><path d="M19 6l1-2" stroke="#7A5B2A" stroke-width="1.6" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 3c5 0 8 6 8 11a8 8 0 0 1-16 0c0-5 3-11 8-11z" fill="#8FC96B"/><circle cx="12" cy="15" r="3.4" fill="#C9874B"/></svg>',
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="9" cy="14" r="4" fill="#9B6FD1"/><circle cx="15" cy="14" r="4" fill="#8A5CC6"/><circle cx="12" cy="9" r="4" fill="#A97FDB"/><path d="M12 5V2" stroke="#5B8C3A" stroke-width="1.6" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 12a8 8 0 0 0 16 0z" fill="#F45D6A"/><path d="M5 12a7 7 0 0 0 14 0" fill="none" stroke="#7CC66B" stroke-width="2"/><g fill="#222"><circle cx="9" cy="15" r=".8"/><circle cx="12" cy="17" r=".8"/><circle cx="15" cy="15" r=".8"/></g></svg>',
  ];

  function fxHtml(kind) {
    const R = rng(kind.length * 977 + 13);
    let h = '';
    switch (kind) {
      case 'flow':
        return '<i class="fx-flow"></i>';
      case 'lava':
      case 'aurora': {
        const cols = kind === 'lava' ? ['#FF9AA2', '#FFC29A', '#B5A8FF', '#9AE6C9'] : ['#20E3B2', '#2D8CFF', '#9B5CFF', '#22D3EE'];
        cols.forEach((c, i) => {
          h += `<i class="fx-blob" style="--c:${c};--x:${r2(10 + R() * 70)}%;--y:${r2(5 + R() * 70)}%;--s:${r2(55 + R() * 40)}cqw;--d:${r2(14 + R() * 10)}s;--dl:-${r2(R() * 10)}s"></i>`;
        });
        return h;
      }
      case 'bubbles':
        for (let i = 0; i < 16; i++) h += `<i class="fx-bubble" style="--x:${r2(R() * 100)}%;--s:${r2(8 + R() * 34)}px;--d:${r2(9 + R() * 12)}s;--dl:-${r2(R() * 20)}s"></i>`;
        return h;
      case 'stars':
        for (let i = 0; i < 70; i++) h += `<i class="fx-star" style="--x:${r2(R() * 100)}%;--y:${r2(R() * 100)}%;--s:${r2(1 + R() * 2.2)}px;--d:${r2(2 + R() * 4)}s;--dl:-${r2(R() * 5)}s"></i>`;
        h += '<i class="fx-shoot"></i><i class="fx-shoot" style="--dl:-4s;--y:28%"></i>';
        return h;
      case 'snow':
        for (let i = 0; i < 45; i++) h += `<i class="fx-flake" style="--x:${r2(R() * 100)}%;--s:${r2(2 + R() * 5)}px;--d:${r2(8 + R() * 10)}s;--dl:-${r2(R() * 18)}s;--sw:${r2(10 + R() * 30)}px"></i>`;
        return h;
      case 'fireflies':
        for (let i = 0; i < 22; i++) h += `<i class="fx-fly" style="--x:${r2(R() * 100)}%;--y:${r2(30 + R() * 70)}%;--d:${r2(7 + R() * 9)}s;--dl:-${r2(R() * 9)}s;--mx:${r2(-60 + R() * 120)}px;--my:${r2(-80 + R() * 60)}px"></i>`;
        return h;
      case 'leaves': {
        const cs = ['#D9822B', '#C4502D', '#E8B23A', '#8DAF4A', '#B8642E'];
        for (let i = 0; i < 14; i++) h += `<i class="fx-leaf" style="color:${cs[i % cs.length]};--x:${r2(R() * 100)}%;--s:${r2(14 + R() * 18)}px;--d:${r2(9 + R() * 9)}s;--dl:-${r2(R() * 16)}s;--sw:${r2(30 + R() * 60)}px;--rot:${r2(200 + R() * 400)}deg">${LEAF}</i>`;
        return h;
      }
      case 'fruit':
        for (let i = 0; i < 12; i++) h += `<i class="fx-fruit" style="--x:${r2(R() * 92)}%;--s:${r2(22 + R() * 26)}px;--d:${r2(14 + R() * 12)}s;--dl:-${r2(R() * 24)}s;--rot:${r2(-90 + R() * 180)}deg">${FRUITS[i % FRUITS.length]}</i>`;
        return h;
      case 'seawave':
        return '<i class="fx-sun"></i>' + [0, 1, 2].map(i => `<i class="fx-wave w${i}"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" width="100%" height="100%"><path d="M0 60 C150 0 450 120 600 60 C750 0 1050 120 1200 60 V120 H0Z" fill="currentColor"/></svg></i>`).join('');
    }
    return '';
  }

  window.Backgrounds = { LIST, CATS, fxHtml };
})();
