'use strict';
const $=id=>document.getElementById(id);
const C={cyan:'#62d9f5',gold:'#f9c369',purple:'#be9afa',grid:'#293d54',axis:'#7387a2',text:'#a9bad0'};
let t=0,running=false,last=performance.now();

function params(){return {f0:+$('natural').value,f:+$('driving').value,z:+$('damping').value}}
function responseAt(f,f0,z){const r=f/f0;return 1/Math.sqrt((1-r*r)**2+(2*z*r)**2)}
function phaseAt(f,f0,z){const r=f/f0;return Math.atan2(2*z*r,1-r*r)}
function state(){const p=params(),r=p.f/p.f0,M=responseAt(p.f,p.f0,p.z),phase=phaseAt(p.f,p.f0,p.z),q=2*Math.PI*p.f*t;return {...p,r,M,phase,force:Math.cos(q),x:M*Math.cos(q-phase)}}
function fmt(n,d=2){return n.toFixed(d)}
function canvas(id){const el=$(id),box=el.getBoundingClientRect(),d=window.devicePixelRatio||1,W=Math.max(1,box.width),H=Math.max(1,box.height);if(el.width!==Math.round(W*d)||el.height!==Math.round(H*d)){el.width=Math.round(W*d);el.height=Math.round(H*d)}const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,W,H);c.font='12px Arial';c.lineWidth=1;return {el,c,W,H}}
function line(c,x1,y1,x2,y2,color,width=1,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([])}
function text(c,s,x,y,color=C.text,align='left'){c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y)}
function dot(c,x,y,color,r=6){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill()}
function arrow(c,x,y,length,color,label){if(Math.abs(length)<2)return;line(c,x,y,x+length,y,color,3);const sign=Math.sign(length);line(c,x+length,y,x+length-sign*8,y-5,color,2);line(c,x+length,y,x+length-sign*8,y+5,color,2);text(c,label,x+length/2,y-11,color,'center')}

function drawOscillator(s){const {c,W,H}=canvas('oscillator'),cy=H*.43,wall=30,eq=W*.55,maxVisual=Math.min(120,W*.22),scaled=Math.tanh(s.x/2.5)*maxVisual,px=eq+scaled;
  line(c,wall,cy-48,wall,cy+48,'#7b8da6',4);for(let y=-42;y<=42;y+=12)line(c,17,cy+y+8,wall,cy+y,'#60718c');
  c.strokeStyle='#8296b3';c.lineWidth=2;c.beginPath();c.moveTo(wall,cy);c.lineTo(wall+15,cy);const end=px-24;for(let i=0;i<=30;i++){const xx=wall+15+(end-wall-25)*i/30,yy=cy+(i===0||i===30?0:(i%2?11:-11));c.lineTo(xx,yy)}c.lineTo(end,cy);c.stroke();
  line(c,eq,cy-76,eq,H-38,'#3c526c',1,[5,5]);text(c,'Equilibrium',eq,cy-87,C.text,'center');
  c.fillStyle=C.cyan;c.fillRect(px-24,cy-28,48,56);c.fillStyle='#0b3543';c.fillRect(px-10,cy-12,20,24);
  line(c,20,cy+31,W-20,cy+31,'#465971',2);arrow(c,px,cy+75,s.force*70,C.gold,'driving force');arrow(c,eq,cy+125,scaled,C.cyan,'x');
  text(c,'Visual motion is compressed when the response is very large.',W-12,H-8,'#8295ad','right');
}

function graphGeometry(W,H){return {L:62,R:W-24,T:24,B:H-45}}
function graphPoint(ev){const el=$('responseGraph'),rect=el.getBoundingClientRect(),g=graphGeometry(rect.width,rect.height),x=Math.max(g.L,Math.min(g.R,ev.clientX-rect.left));return .05+2.95*(x-g.L)/(g.R-g.L)}
function drawGraph(s){const {c,W,H}=canvas('responseGraph'),g=graphGeometry(W,H),maxY=Math.min(12,Math.max(3.5,1/(2*s.z)*1.15));
  for(let y=0;y<=4;y++){const yy=g.B-(g.B-g.T)*y/4;line(c,g.L,yy,g.R,yy,y===0?C.axis:C.grid);text(c,fmt(maxY*y/4,1),g.L-10,yy+4,C.text,'right')}
  for(let f=0;f<=3;f+=.5){const xx=g.L+(g.R-g.L)*f/3;line(c,xx,g.T,xx,g.B,C.grid);text(c,f.toFixed(1),xx,g.B+20,C.text,'center')}
  const naturalX=g.L+(g.R-g.L)*s.f0/3;line(c,naturalX,g.T,naturalX,g.B,C.gold,1,[5,5]);text(c,'f₀',naturalX,g.T+13,C.gold,'center');text(c,'response amplitude  A/Aₛ',g.L,g.T-8,C.cyan);text(c,'driving frequency, f / Hz',g.R,H-5,C.text,'right');
  c.strokeStyle=C.cyan;c.lineWidth=2.5;c.beginPath();for(let i=0;i<=400;i++){const f=.05+2.95*i/400,y=Math.min(responseAt(f,s.f0,s.z),maxY),xx=g.L+(g.R-g.L)*f/3,yy=g.B-(g.B-g.T)*y/maxY;i?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke();
  const px=g.L+(g.R-g.L)*s.f/3,py=g.B-(g.B-g.T)*Math.min(s.M,maxY)/maxY;line(c,px,g.T,px,g.B,'#dfe7f2',1,[3,5]);dot(c,px,py,C.purple,7);text(c,'f = '+s.f.toFixed(2)+' Hz',px+(px>W*.72?-10:10),Math.max(g.T+18,py-12),C.purple,px>W*.72?'right':'left');
}

function region(s){if(Math.abs(s.r-1)<=.08)return ['Near resonance','resonance'];if(s.r<1)return ['Below resonance',''];return ['Above resonance','']}
function render(){const s=state(),[label,cls]=region(s);$('naturalOut').textContent=fmt(s.f0,1)+' Hz';$('drivingOut').textContent=fmt(s.f,2)+' Hz';$('dampingOut').textContent=fmt(s.z,2);$('ratioRead').textContent=fmt(s.r,2);$('amplitudeRead').textContent=fmt(s.M,2)+' Aₛ';$('phaseRead').textContent=fmt(s.phase*180/Math.PI,0)+'°';$('clock').textContent='t = '+fmt(t,2)+' s';$('regionBadge').textContent=label;$('regionBadge').className='badge '+cls;$('meterValue').textContent=fmt(s.M,2)+' × static response';$('meterBar').style.width=Math.min(100,s.M/5*100)+'%';
  if(cls)$('explain').textContent='The driving frequency is close to the natural frequency. Energy is transferred efficiently, so the response amplitude is large.';else if(s.r<1)$('explain').textContent='The oscillator responds almost in phase with the driving force. Increase the driving frequency towards f₀ and watch the amplitude grow.';else $('explain').textContent='Above resonance, the response amplitude falls and the displacement approaches 180° out of phase with the driving force.';
  drawOscillator(s);drawGraph(s);
}
function pause(){running=false;$('play').textContent='Play'}
function reset(){t=0;pause();render()}
$('play').onclick=()=>{running=!running;$('play').textContent=running?'Pause':'Play';last=performance.now()};$('reset').onclick=reset;
['natural','driving','damping'].forEach(id=>$(id).oninput=()=>{t=0;render()});
document.querySelectorAll('[data-ratio]').forEach(btn=>btn.onclick=()=>{const f0=+$('natural').value,ratio=+btn.dataset.ratio;$('driving').value=Math.min(3,Math.max(.1,f0*ratio));t=0;render()});
let graphDragging=false;$('responseGraph').tabIndex=0;$('responseGraph').addEventListener('pointerdown',e=>{graphDragging=true;$('responseGraph').setPointerCapture(e.pointerId);$('driving').value=graphPoint(e);t=0;render()});$('responseGraph').addEventListener('pointermove',e=>{if(graphDragging){$('driving').value=graphPoint(e);t=0;render()}});$('responseGraph').addEventListener('pointerup',()=>graphDragging=false);$('responseGraph').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();$('driving').value=Math.max(.1,Math.min(3,+$('driving').value+(e.key==='ArrowRight'?.05:-.05)));render()});
function frame(now){if(running){t+=Math.min((now-last)/1000,.1)*+$('speed').value;render()}last=now;requestAnimationFrame(frame)}
window.addEventListener('resize',render);render();requestAnimationFrame(frame);

if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'configure_resonance',title:'Configure resonance experiment',description:'Set the natural frequency, driving frequency and damping ratio, then update the visible resonance simulation.',inputSchema:{type:'object',properties:{naturalFrequency:{type:'number',minimum:.5,maximum:2},drivingFrequency:{type:'number',minimum:.1,maximum:3},dampingRatio:{type:'number',minimum:.02,maximum:.4}},required:['naturalFrequency','drivingFrequency','dampingRatio'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).some(k=>!['naturalFrequency','drivingFrequency','dampingRatio'].includes(k)))throw Error('Invalid parameters');for(const [key,min,max] of [['naturalFrequency',.5,2],['drivingFrequency',.1,3],['dampingRatio',.02,.4]])if(typeof input[key]!=='number'||!Number.isFinite(input[key])||input[key]<min||input[key]>max)throw Error(key+' is out of range');$('natural').value=input.naturalFrequency;$('driving').value=input.drivingFrequency;$('damping').value=input.dampingRatio;t=0;render();return {frequencyRatio:input.drivingFrequency/input.naturalFrequency,responseAmplitude:responseAt(input.drivingFrequency,input.naturalFrequency,input.dampingRatio),phaseLagDegrees:phaseAt(input.drivingFrequency,input.naturalFrequency,input.dampingRatio)*180/Math.PI}}})).catch(()=>{});}catch{}}
