/* Helpers */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const now = ()=>performance.now();
const throttle=(fn,wait=16)=>{let last=0;return(...args)=>{const t=now();if(t-last>=wait){last=t;fn(...args);}}};
const ready = fn => (document.readyState!=='loading') ? fn() : document.addEventListener('DOMContentLoaded',fn);

/* Footer year */
ready(()=>{ const y=$('#year'); if(y) y.textContent=new Date().getFullYear(); });

/* Smooth anchor + sticky nav */
ready(()=>{
  const navbar = document.querySelector('.navbar');
  if(navbar){ const top = navbar.offsetTop; window.addEventListener('scroll',()=>{ if(window.scrollY>top+10) navbar.classList.add('ff-sticky'); else navbar.classList.remove('ff-sticky'); },{passive:true}); }
  $$('a[href^="#"]').forEach(a=>{
    const sel=a.getAttribute('href'); if(!sel||sel==='#') return; const tgt=document.querySelector(sel); if(!tgt) return;
    a.addEventListener('click',e=>{ e.preventDefault(); tgt.scrollIntoView({behavior:'smooth',block:'start'}); });
  });
});

/* Reveal on view */
ready(()=>{
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('ff-animated'); io.unobserve(en.target);} });
  },{threshold:.18});
  $$('.ff-card, .section-title, .process-card, .hero-features li').forEach(el=>io.observe(el));
});

/* Split headline into letters */
ready(()=>{
  const h=$('#heroHeadline'); if(!h) return;
  const txt=h.textContent; const em=h.querySelector('.hero-em')?.textContent||null;
  let before=txt, after=''; if(em){ const parts=txt.split(em); before=parts[0]; after=parts[1]||''; }
  h.innerHTML='';
  const spanify=(t,cls)=>{ const wrap=document.createElement('span'); if(cls) wrap.className=cls; [...t].forEach(ch=>{ const s=document.createElement('span'); s.className='hero-letter'; s.textContent=ch; wrap.appendChild(s); }); return wrap; };
  if(before) h.appendChild(spanify(before));
  if(em) h.appendChild(spanify(em,'hero-em'));
  if(after) h.appendChild(spanify(after));
  h.querySelectorAll('.hero-letter').forEach((l,i)=>setTimeout(()=>l.classList.add('in'), i*32));
});

/* ====== DOM Parallax Dots (repel on hover) ====== */
ready(()=>{
  const wrap=$('.hero-section'); const layer=$('#heroParallax'); if(!wrap||!layer) return;
  const colors=['#FFD700','#C0C0C0','#E5E4E2']; const dots=[]; const COUNT=60;
  for(let i=0;i<COUNT;i++){
    const el=document.createElement('span');
    const s=Math.round(Math.random()*8+4);
    el.className='hero-parallax-dot';
    el.style.width=el.style.height=`${s}px`;
    el.style.left=`${Math.random()*100}%`;
    el.style.top=`${Math.random()*100}%`;
    el.style.opacity=`${0.35+Math.random()*0.6}`;
    el.style.background=colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDuration=`${4+Math.random()*5}s`;
    layer.appendChild(el);
    dots.push(el);
  }
  const onMove=throttle((e)=>{
    const r=wrap.getBoundingClientRect();
    const mx=e.clientX-r.left, my=e.clientY-r.top;
    for(const el of dots){
      const d=el.getBoundingClientRect();
      const cx=d.left + d.width/2, cy=d.top + d.height/2;
      const dx=cx-e.clientX, dy=cy-e.clientY;
      const dist=Math.hypot(dx,dy);
      const R=220; // Einflussradius
      if(dist<R){
        const k=(1-dist/R);
        const tx=(dx/(dist||1))*k*28;
        const ty=(dy/(dist||1))*k*28;
        el.style.transform=`translate(${tx}px,${ty}px) scale(${1+0.15*k})`;
        clearTimeout(el._t); el._t=setTimeout(()=>{ el.style.transform=''; },320);
      }
    }
  }, 12);
  wrap.addEventListener('mousemove', onMove);
  wrap.addEventListener('mouseleave', ()=>dots.forEach(el=>{ el.style.transform=''; }));
});

/* ====== Canvas Particles — super reactive to mouse ====== */
ready(()=>{
  const wrap=$('.hero-section'); const canvas=$('#heroCanvas'); if(!wrap||!canvas) return;
  const ctx=canvas.getContext('2d');
  function resize(){ canvas.width=wrap.clientWidth; canvas.height=wrap.clientHeight; }
  resize(); window.addEventListener('resize',()=>{ clearTimeout(canvas._r); canvas._r=setTimeout(resize,120); });

  const colors=['rgba(192,192,192,0.95)','rgba(255,215,0,0.95)','rgba(227,242,255,0.9)'];
  const COUNT=170; const P=[]; const rnd=(a,b)=>Math.random()*(b-a)+a;
  let mouse={x:null,y:null,active:false,speed:0}, last=now();

  for(let i=0;i<COUNT;i++){
    const r=rnd(0.8,3.2), a=rnd(0.35,0.95);
    P.push({x:rnd(0,canvas.width),y:rnd(0,canvas.height),vx:rnd(-0.7,0.7),vy:rnd(-1,1),r,baseR:r,c:colors[Math|0]});
    P[i].a=a; P[i].c=colors[Math.floor(Math.random()*colors.length)];
  }

  // Mausbewegung auf dem ganzen Hero erfassen
  wrap.addEventListener('mousemove', throttle((e)=>{
    const rect=canvas.getBoundingClientRect();
    const nx=e.clientX-rect.left, ny=e.clientY-rect.top;
    const t=now(); const dt=Math.max(1,t-last);
    const dx=(mouse.x??nx)-nx, dy=(mouse.y??ny)-ny;
    mouse.speed = clamp(Math.hypot(dx,dy)/dt*35, 0, 3);
    last=t; mouse.x=nx; mouse.y=ny; mouse.active=true;
  }, 12), {passive:true});
  wrap.addEventListener('mouseleave', ()=>{ mouse.active=false; });

  function step(){
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    for(const p of P){
      p.x+=p.vx; p.y+=p.vy;
      // Wrap
      if(p.x<-20) p.x=w+20; if(p.x>w+20) p.x=-20;
      if(p.y<-20) p.y=h+20; if(p.y>h+20) p.y=-20;

      // Maus-Interaktion
      if(mouse.active && mouse.x!=null){
        const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
        const R=140+mouse.speed*40;
        if(d<R && d>0.1){
          const f=(R-d)/R;
          const power=3 + mouse.speed*2;
          p.vx += (dx/d)*f*power*0.07;
          p.vy += (dy/d)*f*power*0.07;
          p.r = Math.min(p.baseR*3, p.r + 0.14*f);
        }else{
          p.r += (p.baseR-p.r)*0.04;
          p.vx*=0.994; p.vy*=0.994;
        }
      }
      p.vx = clamp(p.vx,-1.8,1.8); p.vy = clamp(p.vy,-1.8,1.8);

      // Draw
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c; ctx.globalAlpha=p.a; ctx.shadowBlur=Math.min(18,p.r*5); ctx.shadowColor=p.c;
      ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
    }
    // Soft links
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){
      const p=P[i],q=P[j]; const dx=p.x-q.x, dy=p.y-q.y, d=Math.hypot(dx,dy);
      if(d<78){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=`rgba(200,200,200,${0.05*(1-d/78)})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    requestAnimationFrame(step);
  }
  step();
});

/* Portfolio filter */
ready(()=>{
  const btns=$$('[data-filter]'); if(!btns.length) return;
  btns.forEach(btn=>btn.addEventListener('click',e=>{
    e.preventDefault(); btns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const f=btn.getAttribute('data-filter');
    $$('.portfolio-item').forEach(it=>{
      if(f==='all'||it.dataset.type===f){ it.classList.remove('ff-hidden'); it.style.display=''; }
      else { it.classList.add('ff-hidden'); it.style.display='none'; }
    });
  }));
});

/* Prozess Timeline & Glow */
ready(()=>{
  const steps=$$('#prozess .process-card'); const line=$('#processLine');
  if(!steps.length||!line) return;
  const io=new IntersectionObserver(es=>{
    es.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('active','ff-animated'); }
    });
  },{threshold:.35});
  steps.forEach(s=>io.observe(s));
  const lineObs=new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting) line.classList.add('active'); });
  },{threshold:.25});
  lineObs.observe(steps[0]);
});

/* Contact form micro-FX */
ready(()=>{
  const form=$('#contactForm'); if(!form) return;
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.classList.add('was-validated'); return; }
    const btn=form.querySelector('button[type="submit"]');
    if(btn){ btn.disabled=true; const t=btn.textContent; btn.textContent='Sende…'; setTimeout(()=>{ alert('Danke! Wir melden uns innerhalb von 24 Stunden.'); form.reset(); btn.disabled=false; btn.textContent=t; },1000); }
  });
});

/* Magnetic buttons */
ready(()=>{
  $$('.magnetic').forEach(el=>{
    const s=18;
    el.addEventListener('mousemove', throttle(e=>{
      const r=el.getBoundingClientRect(); const x=e.clientX-r.left-r.width/2; const y=e.clientY-r.top-r.height/2;
      el.style.transform=`translate(${x/s}px, ${y/s}px)`;
    },16));
    el.addEventListener('mouseleave',()=>{ el.style.transform=''; });
  });
});
