const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Mobile navigation
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-menu a");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// Typing effect
const typedText = document.getElementById("typed-text");
const roles = [
  "Threat Hunter",
  "Detection Engineer",
  "CTI Analyst",
  "Incident Responder",
  "Security Automation"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  if (!typedText) return;
  if (prefersReducedMotion.matches) { typedText.textContent=roles[0]; return; }
  const currentRole = roles[roleIndex];
  typedText.textContent = currentRole.slice(0, charIndex);

  if (!isDeleting && charIndex < currentRole.length) {
    charIndex++;
    setTimeout(typeLoop, 85);
    return;
  }
  if (!isDeleting && charIndex === currentRole.length) {
    isDeleting = true;
    setTimeout(typeLoop, 1600);
    return;
  }
  if (isDeleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeLoop, 42);
    return;
  }
  isDeleting = false;
  roleIndex = (roleIndex + 1) % roles.length;
  setTimeout(typeLoop, 300);
}

if (prefersReducedMotion.matches) { if (typedText) typedText.textContent = roles[0]; } else typeLoop();
document.addEventListener('keydown', event => { if(event.key === 'Escape') { document.body.classList.remove('menu-open');navToggle?.setAttribute('aria-expanded','false'); } });

// Reveal on scroll
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.12 }
);
revealElements.forEach((el) => revealObserver.observe(el));

// Animate skill bars
const skillBars = document.querySelectorAll(".skill-bar span");
const skillObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.getAttribute("data-width") || "100%";
        observer.unobserve(bar);
      }
    });
  },
  { threshold: 0.4 }
);
skillBars.forEach((bar) => skillObserver.observe(bar));

// Terminal
const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const terminalCommands = {
  help: [
    "┌─ Available commands ─────────────────┐",
    "  help     — show this menu",
    "  about    — who is YRO",
    "  skills   — capability overview",
    "  certs    — certifications",
    "  projects — project list",
    "  contact  — get in touch",
    "  clear    — clear terminal",
    "└──────────────────────────────────────┘"
  ],
  about: [
    "Argyro Ouzounoglou // YRO",
    "Threat Hunter & Detection Engineer",
    "Promoted SOC L1 → Threat Hunter within months.",
    "Builds frameworks, detections, and CTI programs from scratch.",
    "eCTHP v3 certified. CompTIA Security+.",
    "Currently targeting senior security roles."
  ],
  skills: [
    "CORE CAPABILITIES:",
    "  ► Threat hunting & documented investigations",
    "  ► Detection creation, maintenance & tuning",
    "  ► OpenCTI setup & CTI methodology",
    "  ► Elastic / Grafana dashboards",
    "  ► Elastic ML & platform troubleshooting",
    "  ► Analyst training & workflow automation",
    "STACK: Elastic, KQL, ESQL, EQL, SIGMA,",
    "  MITRE ATT&CK, Shuffler, OpenCTI, Grafana, Jira",
    "DEVELOPING: Kubernetes security & rules"
  ],
  certs: [
    "CERTIFICATIONS:",
    "  ✦ eCTHP v3 — May 2026 [CERTIFIED]",
    "  ✦ CompTIA Security+ — November 2025 [CERTIFIED]",
    "  ◌ Digital Forensics         [UPCOMING]"
  ],
  projects: [
    "PROJECTS [5 total]:",
    "  [01] OpenCTI & Intelligence Operations",
    "  [02] SOC & Client Dashboards",
    "  [03] Threat Hunting & Investigation",
    "  [04] Detection Engineering — Rules & Training",
    "  [05] Shuffler SOC Automation",
    "Navigate to the Projects section to explore."
  ],
  contact: [
    "OPEN CHANNEL:",
    "Email: yro.makri@gmail.com",
    "Phone: +30 698 569 0023"
  ]
};

function appendTerminalLine(text, className = "") {
  if (!terminalOutput) return;
  const line = document.createElement("p");
  if (className) line.className = className;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

if (terminalForm && terminalInput) {
  terminalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const rawValue = terminalInput.value.trim();
    const command = rawValue.toLowerCase();

    appendTerminalLine(`visitor@yro:~$ ${rawValue || ""}`);

    if (!command) {
      appendTerminalLine("No command entered. Type 'help' for options.", "output");
      terminalInput.value = "";
      return;
    }

    if (command === "clear") {
      terminalOutput.innerHTML = "";
      terminalInput.value = "";
      return;
    }

    const result = Object.hasOwn(terminalCommands, command) ? terminalCommands[command] : null;
    if (result) {
      result.forEach((line) => appendTerminalLine(line, "output"));
    } else {
      appendTerminalLine(`command not found: ${command}. Try 'help'.`, "output");
    }

    terminalInput.value = "";
  });
}

// Particle background: suspend work for reduced motion and hidden tabs.
const canvas=document.getElementById('particle-canvas'), ctx=canvas?.getContext('2d');
if(canvas&&ctx){
 let width=innerWidth,height=innerHeight,frame=0,last=0;
 const particles=Array.from({length:45},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.006,vy:(Math.random()-.5)*.006}));
 function draw(dt=0){ctx.clearRect(0,0,width,height);for(const p of particles){p.x=(p.x+p.vx*dt+1)%1;p.y=(p.y+p.vy*dt+1)%1;ctx.fillStyle='rgba(142,232,255,.3)';ctx.beginPath();ctx.arc(p.x*width,p.y*height,1.2,0,Math.PI*2);ctx.fill()}}
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
 function tick(now){frame=0;if(document.hidden||prefersReducedMotion.matches)return;draw(Math.min(.05,(now-last)/1000));last=now;frame=requestAnimationFrame(tick)}
 function start(){if(!frame&&!document.hidden&&!prefersReducedMotion.matches){last=performance.now();frame=requestAnimationFrame(tick)}}
 function sync(){cancelAnimationFrame(frame);frame=0;draw();start()}
 addEventListener('resize',resize);document.addEventListener('visibilitychange',sync);prefersReducedMotion.addEventListener('change',sync);resize();start();
}
// A deliberate transition into the optional cinematic experience.
let cinematicLeaving=false;
document.querySelectorAll('a[href="experience.html"]').forEach(link=>link.addEventListener('click',event=>{
 if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 if(prefersReducedMotion.matches)return;
 event.preventDefault();if(cinematicLeaving)return;cinematicLeaving=true;
 const curtain=document.createElement('div');curtain.className='cinematic-curtain';curtain.setAttribute('aria-hidden','true');curtain.innerHTML='<div class="portal-ring"></div><span></span><p>ENTERING THE SIGNAL</p>';document.body.append(curtain);
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add('cinematic-departure')));
 setTimeout(()=>location.assign(link.href),1200);
}));
window.addEventListener('pageshow',()=>{cinematicLeaving=false;document.body.classList.remove('cinematic-departure');document.querySelector('.cinematic-curtain')?.remove()});
