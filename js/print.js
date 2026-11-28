const danoP=o=>{const d=o.danos||[];return`<div style="position:relative;display:inline-block;vertical-align:top;margin:4px 8px 0 0"><img src="img/moto.png" style="height:130px">${d.map((m,i)=>`<span style="position:absolute;left:${m.x}%;top:${m.y}%;transform:translate(-50%,-50%);background:#DC2626;color:#fff;border-radius:50%;width:14px;height:14px;font:bold 9px/14px Arial;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">${i+1}</span>`).join('')}</div>${d.length?`<div style="display:inline-block;vertical-align:top;font-size:10px;margin-top:4px">${d.map((m,i)=>`${i+1}. ${esc(m.t)}${m.n?' — '+esc(m.n):''}`).join('<br>')}</div>`:''}`};
// Vista de impresión / PDF con el formato en papel de la agencia (v57: idéntico al formato Word; el folio va arriba a la derecha)
// Recortes de img/moto.png (porcentajes l,t,r,b) para las 4 vistas del formato: lateral, frontal, superior y lateral
const VISTAS_P=[[0,5.012,36.694,44.017,170],[68.228,4.835,0,44.194,95],[2.885,61.222,35.846,1.697,190],[3.259,5.057,35.471,43.259,165]];
const vistaP=(v,o,marcas)=>{const[l,t,r,b,W]=v,w=100-l-r,h=100-t-b,H=Math.round(W*455*h/(626*w));
  const mk=marcas?(o.danos||[]).map((m,i)=>{const x=(m.x-l)/w*100,y=(m.y-t)/h*100;return x<0||x>100||y<0||y>100?'':`<span class="o_dm" style="left:${x}%;top:${y}%">${i+1}</span>`}).join(''):'';
  return`<div class="o_vp" style="width:${W}px;height:${H}px"><img src="img/moto.png" alt="" style="width:${W*100/w}px;left:${-l*W/w}px;top:${-t/h*H}px">${mk}</div>`};
function imprimir(o){
  normChk(o);
  const s=datosAg(o.suc),t=tot(o),im=(x,h)=>src(x)?`<img src="${src(x)}" style="max-height:${h||44}px;max-width:100%">`:'',
    lg=logoDe(o.suc)==='carabela'?'img/logo-carabela.png':LOGO_BASE+'logo-'+logoDe(o.suc)+'.png',
    dir=String(s.d||'').split(/\s(?=C\.P\.)/i),
    inv=(a,b)=>INV32.slice(a,b).map((n,i)=>{const x=o.inv[a+i];return[a+i+1,n.toUpperCase(),x.p?x.c:'']}),
    L1=inv(0,16),L2=inv(16,32),
    filasInv=L1.map((a,i)=>{const b=L2[i];return`<tr><td class="o_n">${a[0]}</td><td>${esc(a[1])}</td><td class="o_c">${esc(a[2])}</td><td class="o_n">${b[0]}</td><td>${esc(b[1])}</td><td class="o_c">${esc(b[2])}</td></tr>`}).join(''),
    rows=o.lineas.map((l,i)=>`<tr><td class="o_n">${i+1}</td><td>${esc(l.sku)}</td><td>${esc(l.desc)} <i>(${AUT.find(a=>a[0]===l.st)[1]})</i></td><td class="o_c">${l.t==='mo'?(tarifa()>0?hrsTxt(l)+' h':''):l.cant}</td><td class="o_r">${money(l.precio)}</td><td class="o_r">${l.st==='gar'?'GARANTÍA':money(imp(l))}</td></tr>`);
  while(rows.length<7)rows.push(`<tr><td class="o_n">${rows.length+1}</td><td></td><td></td><td></td><td></td><td></td></tr>`);
  const danos=(o.danos||[]).map((m,i)=>`${i+1}. ${esc(m.t)}${m.n?' — '+esc(m.n):''}`).join(' &nbsp;·&nbsp; '),
    tec=CATS.map((c,i)=>o.chk[i].e==='nr'?'':`${c[0]}: ${COND.find(x=>x[0]===o.chk[i].e)[1]}${o.chk[i].n?' ('+esc(o.chk[i].n)+')':''}`).filter(Boolean).join(' · '),
    fRec=o.firmas.carr||o.firmas.entrega;
  $('#print').innerHTML=`<table class="o_fo"><colgroup><col style="width:7.5%"><col style="width:7.5%"><col style="width:5%"><col style="width:25%"><col style="width:24%"><col style="width:31%"></colgroup>
  <tr class="o_hd"><td colspan="2" class="o_lgo">${'<img src="'+lg+'" alt="">'}</td><td class="o_sep"></td><td colspan="2" class="o_cen"><b class="o_t1">LA BARATA DEL HOGAR</b><br>AGENCIA: ${esc(s.n)}${dir[0]?', '+esc(dir[0]):''}<br>${esc(dir[1]||'')}<br>${esc(s.t)}</td><td class="o_lgo2"><div class="o_folio">FOLIO: <b>${esc(o.folio)}</b></div><img src="img/logo-camejo.png" alt="Grupo Camejo"></td></tr>
  <tr class="o_g"><td class="o_lb" colspan="2">CLIENTE:</td><td class="o_v" colspan="3">${esc(o.cliente)}${o.trae?' &nbsp;·&nbsp; LA TRAE: '+esc(o.trae):''}</td><td class="o_rb"><span class="o_lb2">FECHA COMPRA:</span><span class="o_v2">${o.fcompra?esc(fechaMx(o.fcompra)):''}</span></td></tr>
  <tr class="o_g"><td class="o_lb" colspan="2">DIRECCION:</td><td class="o_v" colspan="3">${esc(o.dir)}</td><td class="o_rb"><span class="o_lb2">TELÉFONO:</span><span class="o_v2">${esc(o.tel)}</span></td></tr>
  <tr class="o_g"><td class="o_lb" colspan="2">MODELO:</td><td class="o_v" colspan="3">${esc([o.marca,o.modelo,o.anio].filter(Boolean).join(' '))}</td><td class="o_rb"><span class="o_lb2">MOTOR:</span><span class="o_v2">${esc(o.motor)}</span></td></tr>
  <tr class="o_g"><td class="o_lb" colspan="2">SERIE:</td><td class="o_v" colspan="3">${esc(o.vin)}</td><td class="o_rb"><span class="o_lb2">KM:</span><span class="o_v2">${esc(fmtKm(o.km))}</span></td></tr>
  <tr class="o_g"><td class="o_lb" colspan="2">${o.placas?'PLACAS:':''}</td><td class="o_v" colspan="3">${esc(o.placas||'')}</td><td class="o_rb"><span class="o_lb2">FECHA INGRESO:</span><span class="o_v2">${new Date(o.fing||o.cre||Date.now()).toLocaleDateString('es-MX')}</span></td></tr>
  <tr><td colspan="6" class="o_ttl">ORDEN DE SERVICIO</td></tr>
  <tr><td colspan="5" class="o_izq"><table class="o_in"><colgroup><col style="width:5%"><col style="width:36%"><col style="width:9%"><col style="width:5%"><col style="width:36%"><col style="width:9%"></colgroup>
    <tr class="o_th"><th>NO</th><th>DESCRIPCION</th><th>CANT</th><th>NO</th><th>DESCRIPCION</th><th>CANT</th></tr>${filasInv}</table>
    <div class="o_bar">CONDICIONES EN LAS QUE SE RECIBE LA UNIDAD</div>
    <div class="o_rg o_l3">${esc(o.cond||'')}${danos?(o.cond?'<br>':'')+'<span class="o_sm9">DAÑOS: '+danos+'</span>':''}</div>
    <table class="o_tp"><tr><td class="o_tl" rowspan="1">TRABAJO<br>SOLICITADO</td>${Object.entries(TIPOS).map(([k,v])=>`<td class="${k===o.tipo?'o_sel':''}">${k}.<br>${esc(v.toUpperCase().replace('SERVICIO DE ','SERV. ').replace('SERVICIO ','SERV. '))}${k===o.tipo?'<span class="o_tacha">X</span>':''}</td>`).join('')}</tr></table>
    <div class="o_rg o_l4">${esc(o.motivo||'')}</div>
    <div class="o_bar">DIAGNÓSTICO DEL TÉCNICO</div>
    <div class="o_rg o_l5">${esc(o.diag||'')}${tec?(o.diag?'<br>':'')+'<span class="o_sm9">CONDICIÓN TÉCNICA: '+esc(tec)+'</span>':''}</div>
    <table class="o_fi"><tr><td><div class="o_fs">${im(fRec,40)}</div><div class="o_fl">NOMBRE Y FIRMA DEL CLIENTE DE ENTREGA</div><div class="o_fn">${esc(o.firmas.carr?.n||'')}</div></td><td><div class="o_fs"></div><div class="o_fl">NOMBRE Y FIRMA DEL QUE RECIBE LA UNIDAD</div><div class="o_fn">${esc(o.recibe||o.asesor||'')}</div></td></tr>
    <tr><td colspan="2" class="o_ley">${LEYENDA.toUpperCase()}</td></tr></table>
  </td><td class="o_der"><div class="o_gar"><div class="o_gh">¿ES GARANTÍA?</div><div class="o_gb"><span>SI <b>[${o.gar?'X':'&nbsp;'}]</b></span><span>NO <b>[${o.gar?'&nbsp;':'X'}]</b></span></div></div>
    <div class="o_vs"><div class="o_rl"><img src="img/reloj-1.png" alt=""><img src="img/reloj-2.png" alt=""></div>${vistaP(VISTAS_P[0],o,true)}${vistaP(VISTAS_P[1],o,true)}${vistaP(VISTAS_P[2],o,true)}${vistaP(VISTAS_P[3],o,false)}</div></td></tr>
  <tr><td colspan="6" class="o_pt">PRESUPUESTO DE INSUMOS Y MANO DE OBRA</td></tr>
  <tr><td colspan="6" class="o_pp"><table class="o_pr"><colgroup><col style="width:6%"><col style="width:15%"><col style="width:45%"><col style="width:10%"><col style="width:12%"><col style="width:12%"></colgroup>
    <tr class="o_th"><th>NO.</th><th class="o_al">SKU</th><th class="o_al">DESCRIPCION REFACCION/MANO DE OBRA/REPARACIONES O REEMPLAZOS</th><th># REFAC.</th><th>PRECIO UNI ($)</th><th>IMPORTE ($)</th></tr>${rows.join('')}
    <tr class="o_tt"><td colspan="5" class="o_r"><b>TOTAL: $</b></td><td class="o_r"><b>${money(t.aut)}</b></td></tr></table>
    ${o.auth?`<div class="o_au"><b>PRESUPUESTO AUTORIZADO POR EL CLIENTE DESDE EL ENLACE:</b> ${esc(o.auth.n)} · ${new Date(o.auth.t).toLocaleString('es-MX')} ${im(o.firmas.aut,30)}</div>`:''}</td></tr>
  <tr><td colspan="6" class="o_cert">${CERT.toUpperCase()}</td></tr>
  <tr><td colspan="6" class="o_pp"><table class="o_fr"><tr>${FIRMAS.map(([k,n])=>`<td><div class="o_fs">${im(o.firmas[k],36)}</div><div class="o_fn">${esc(o.firmas[k]?.n||'')}</div><div class="o_fl">${k==='vobo'?'V.o.B.o':'NOMBRE Y FIRMA '+(k==='ref'?'REFACCIONARIA':k==='mec'?'DEL MECÁNICO':'DEL CLIENTE')}</div></td>`).join('')}</tr></table></td></tr></table>`;
  setTimeout(()=>print(),150)}
