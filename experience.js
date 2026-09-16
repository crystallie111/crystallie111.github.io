/* Tabs work independently of graphics; the page stays in one viewport. */
(() => {
 'use strict';
 const canvas=document.getElementById('canvas'),motion=document.getElementById('motion-toggle');
 const tabs=[...document.querySelectorAll('[role="tab"]')],panels=tabs.map(t=>document.getElementById(t.dataset.section));
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=preference.matches,progress=0,smoothed=0,clock=0,last=0,raf=0,scene=null,dirty=true,active=-1,exitTimer,entered=false,entering=false,entryElapsed=0,entryFlight=0;
 const start=document.getElementById("start-screen"),ui=document.getElementById("experience-ui"),close=document.getElementById("panel-close");
 function finishEntry(){entering=false;entered=true;start.hidden=true;ui.hidden=false;ui.inert=false;document.body.classList.remove('entering-star');document.body.classList.add('entered');tabs[0].focus();}
 document.getElementById('enter-btn').addEventListener('click',()=>{
  if(entered||entering)return;
  if(paused||preference.matches){finishEntry();return;}
  entering=true;entryElapsed=0;start.inert=true;document.getElementById('enter-btn').disabled=true;
  document.body.classList.add('entering-star');dirty=true;wake();
 });
 function closePanel(){
  if(active<0)return;clearTimeout(exitTimer);const previous=active;active=-1;
  panels.forEach((p,i)=>{p.inert=true;p.setAttribute('aria-hidden','true');p.classList.remove('entering');if(i===previous&&!paused){p.classList.add('leaving');exitTimer=setTimeout(()=>{p.hidden=true;p.classList.remove('leaving')},320)}else p.hidden=true;});
  tabs.forEach((t,i)=>{t.inert=false;t.removeAttribute('aria-hidden');t.setAttribute('aria-selected','false');t.tabIndex=i===previous?0:-1;});
  close.hidden=true;document.body.classList.remove('panel-open');document.getElementById('section-status').textContent='SELECT A TAB';history.replaceState(null,'',location.pathname+location.search);tabs[previous].focus();
 }
 close.addEventListener("click",closePanel);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&active>=0)closePanel()});
 function select(index,updateHash=true){
  if(!entered)return;
  if(index===active){closePanel();return;}
  close.hidden=false;document.body.classList.add("panel-open");
  clearTimeout(exitTimer);
  panels.forEach((p,i)=>{p.classList.remove('entering','leaving');p.hidden=true;p.inert=true;p.setAttribute('aria-hidden','true');tabs[i].setAttribute('aria-selected',String(i===index));tabs[i].tabIndex=i===index?0:-1;tabs[i].inert=i!==index;if(i!==index)tabs[i].setAttribute('aria-hidden','true');else tabs[i].removeAttribute('aria-hidden');});
  const previous=active;active=index;
  if(previous>=0&&!paused){const old=panels[previous];old.hidden=false;old.classList.add('leaving');exitTimer=setTimeout(()=>{old.hidden=true;old.classList.remove('leaving')},320);}
  const panel=panels[index];panel.hidden=false;panel.inert=false;panel.removeAttribute('aria-hidden');panel.scrollTop=0;panel.classList.add('entering');
  progress=index*.018;dirty=true;wake();
  document.getElementById('section-status').textContent=`0${index+1} / ${tabs[index].textContent.replace(/0[1-4]|↗/g,'').trim().toUpperCase()}`;
  if(updateHash)history.replaceState(null,'','#'+panel.id);
 }
 tabs.forEach((tab,i)=>{tab.style.setProperty('--tab-index',i);tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{if(active>=0)return;let next=i;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();tabs[next].focus();select(next);});});
 function fromHash(){const i=tabs.findIndex(t=>'#'+t.dataset.section===location.hash);if(entered&&i>=0&&i!==active)select(i,false);}
 window.addEventListener('hashchange',fromHash);
 function syncMotion(){if(paused&&entering){entryFlight=0;finishEntry();}motion.textContent=paused?'Resume motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));document.documentElement.classList.toggle('motion-paused',paused);dirty=true;wake();}
 motion.addEventListener('click',()=>{paused=!paused;syncMotion()});preference.addEventListener('change',()=>{paused=preference.matches;syncMotion()});
 window.addEventListener('resize',()=>{scene?.resize();dirty=true;wake()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0}else{dirty=true;wake()}});
 function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame)}
 function frame(now){
  raf=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused){clock+=dt;smoothed+=(progress-smoothed)*(1-Math.exp(-dt*4));}
  if(entering){entryElapsed+=dt;const t=Math.min(entryElapsed/2.6,1);entryFlight=t*t*t*(t*(t*6-15)+10);dirty=true;if(t===1)finishEntry();}
  if(scene&&(dirty||!paused)){scene.draw(clock,smoothed);dirty=false;}
  if(entering||(!paused&&scene))wake();else last=0;
 }
 try{scene=createScene(canvas);document.documentElement.classList.add('has-webgl');canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();scene=null;document.documentElement.classList.remove('has-webgl')});canvas.addEventListener('webglcontextrestored',()=>{try{scene=createScene(canvas);document.documentElement.classList.add('has-webgl');dirty=true;wake()}catch{scene=null}})}catch(error){console.info('Cinematic scene uses the static fallback:',error.message)}
 panels.forEach(p=>{p.hidden=true;p.inert=true});syncMotion();
 function createScene(canvas){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');
  const mobile=matchMedia('(max-width:700px)').matches;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
  function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
  const common=`precision highp float;uniform float uTime,uProgress,uAspect,uMobile,uEntry;mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}vec4 project(vec3 p){float near=.08,far=90.;return vec4(p.x*1.75/uAspect,p.y*1.75,(-(far+near)*p.z-2.*far*near)/(far-near),-p.z);}float camera(){return 8.-uProgress*34.-uEntry*14.;}`;
  const star=program(common+`attribute vec3 aPosition,aNormal;varying vec3 vNormal,vView;void main(){mat3 r=ry(uTime*.15+.35+uProgress*1.2)*rx(.3+uTime*.09)*rz(.28);vec3 pos=r*aPosition;pos.x+=mix(-2.6,.35,uMobile)*(1.-smoothstep(0.,.38,uProgress))*(1.-smoothstep(0.,.35,uEntry));pos.y+=uMobile*.9*(1.-smoothstep(0.,.35,uEntry));pos.z-=camera();vNormal=r*aNormal;vView=-pos;gl_Position=project(pos);}`,
  `precision highp float;varying vec3 vNormal,vView;void main(){vec3 n=normalize(vNormal),v=normalize(vView);if(dot(n,v)<0.)n=-n;vec3 r=reflect(-v,n);float fres=pow(1.-max(dot(n,v),0.),3.);float band=pow(max(0.,1.-abs(r.y-.32)*2.4),14.);float strip=pow(max(0.,dot(r,normalize(vec3(-.8,.4,1.)))),45.);float lower=pow(max(0.,dot(r,normalize(vec3(.4,-.7,.8)))),28.);vec3 col=mix(vec3(.025,.022,.04),vec3(.47,.45,.53),smoothstep(-.5,.75,r.y));col+=vec3(.91,.88,1.)*band*1.25+vec3(1.)*strip*1.7+vec3(.4,.18,.8)*lower*.7;col+=vec3(.48,.25,.85)*fres*.7;col=col/(col+.65);gl_FragColor=vec4(pow(col,vec3(.85)),1.);}`);
  const points=program(common+`attribute vec4 aParticle;uniform float uDpr,uHalo;varying float vAlpha,vTint;void main(){float a=aParticle.x+uTime*.025;float z=aParticle.z;float radius=aParticle.y;vec3 p=vec3(cos(a)*radius,sin(a)*radius*.78,z);p.xy+=vec2(sin(z*.25+uTime*.06),cos(z*.18+uTime*.05))*.5;p.z-=camera();float dist=-p.z;vAlpha=smoothstep(.25,2.,dist)*(1.-smoothstep(30.,60.,dist))*(.3+aParticle.w*.7);vTint=aParticle.w;gl_Position=project(p);gl_PointSize=clamp((uHalo>.5?100.:13.)*(.4+aParticle.w)*uDpr/max(dist,1.),uHalo>.5?3.:1.,uHalo>.5?95.:8.);if(dist<.2){gl_Position=vec4(2.,2.,2.,1.);vAlpha=0.;}}`,
  `precision highp float;varying float vAlpha,vTint;uniform float uHalo;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float glow=uHalo>.5?pow(1.-d,3.)*.10:pow(1.-d,1.5)*.8;vec3 color=mix(vec3(.40,.18,1.),vec3(.77,.66,1.),vTint);if(vTint>.93)color=vec3(.7,.8,1.);gl_FragColor=vec4(color,glow*vAlpha);}`);
  const positions=[],normals=[],indices=[],segments=128,rings=64;
  const power=v=>Math.sign(v)*Math.pow(Math.abs(v),2.7);
  function pos(i,j){const lat=Math.PI*i/rings-Math.PI/2,lon=2*Math.PI*j/segments;return [2.5*power(Math.cos(lat))*power(Math.cos(lon)),2.5*power(Math.sin(lat)),2.5*power(Math.cos(lat))*power(Math.sin(lon))]}
  for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){const p=pos(i,j);positions.push(...p);const n=p.map(v=>Math.sign(v)*Math.pow(Math.max(Math.abs(v),.00001),2/2.7-1));const length=Math.hypot(...n)||1;normals.push(...n.map(v=>v/length));}
  for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1)}
  function buffer(data,target=gl.ARRAY_BUFFER){const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b}
  const vb=buffer(new Float32Array(positions)),nb=buffer(new Float32Array(normals)),ib=buffer(new Uint16Array(indices),gl.ELEMENT_ARRAY_BUFFER);
  let seed=2741;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
  const count=mobile?1600:4200,data=[];for(let i=0;i<count;i++)data.push(random()*Math.PI*2,1.3+Math.pow(random(),.6)*14,7-random()*64,random());const pb=buffer(new Float32Array(data));
  function attribute(p,name,b,size){const loc=gl.getAttribLocation(p,name);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)}
  const uniforms=new Map;for(const p of [star,points]){const u={};for(const name of ['uTime','uProgress','uAspect','uMobile','uDpr','uHalo','uEntry'])u[name]=gl.getUniformLocation(p,name);uniforms.set(p,u)}
  let dpr=1;function resize(){dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.75);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height)}resize();
  function use(p,t,progress){gl.useProgram(p);const u=uniforms.get(p);gl.uniform1f(u.uTime,t);gl.uniform1f(u.uEntry,entryFlight);gl.uniform1f(u.uProgress,progress);gl.uniform1f(u.uAspect,canvas.width/canvas.height);gl.uniform1f(u.uMobile,innerWidth<=700?1:0);return u}
  function draw(t,progress){gl.clearColor(.027,.023,.045,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);use(star,t,progress);attribute(star,'aPosition',vb,3);attribute(star,'aNormal',nb,3);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);const u=use(points,t,progress);attribute(points,'aParticle',pb,4);gl.uniform1f(u.uDpr,dpr);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.uniform1f(u.uHalo,1);gl.drawArrays(gl.POINTS,0,count);gl.uniform1f(u.uHalo,0);gl.drawArrays(gl.POINTS,0,count);gl.depthMask(true);}
  return{resize,draw};
 }
})();

