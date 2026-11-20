function abrirFirma(cb){
  const m=document.getElementById('modal');
  m.innerHTML='<div class="ov"><div class="sh" role="dialog" aria-label="Firma del cliente"><div class="h">Firma del cliente</div><div class="mut">Conforme con el inventario y la evidencia fotográfica.</div><canvas id="sig"></canvas><div class="row"><button class="btn" id="sg-x">Cancelar</button><button class="btn" id="sg-c">Limpiar</button><button class="btn pri" id="sg-ok">Guardar</button></div></div></div>';
  const c=document.getElementById('sig'),r=c.getBoundingClientRect(),k=window.devicePixelRatio||1;
  c.width=r.width*k;c.height=r.height*k;const x=c.getContext('2d');x.scale(k,k);x.lineWidth=2.5;x.lineCap='round';x.strokeStyle='#0F172A';
  let d=false,t=false;const p=e=>{const b=c.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
  c.onpointerdown=e=>{d=true;t=true;c.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...p(e))};
  c.onpointermove=e=>{if(d){x.lineTo(...p(e));x.stroke()}};c.onpointerup=()=>{d=false};
  document.getElementById('sg-c').onclick=()=>{x.clearRect(0,0,c.width,c.height);t=false};
  document.getElementById('sg-x').onclick=()=>{m.innerHTML=''};
  document.getElementById('sg-ok').onclick=()=>{if(!t)return;const u=c.toDataURL('image/png');m.innerHTML='';cb(u)};
}
