// Cliente REST. TALLER_API = URL de la implementación de gas/taller_api.gs (se guarda en Configuración).
const CATALOGO_API="https://catalogo-labarata-proxy.catalogo-labarata.workers.dev";
const tallerUrl=()=>localStorage.getItem('taller_api')||'';
async function post(url,body){const r=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body)});return r.json()}
const api={
  taller:b=>{const u=tallerUrl();if(!u)throw new Error('Sin URL de API');return post(u,Object.assign({clave:localStorage.getItem('taller_clave')||''},b))},
  // Catálogo existente (mismas acciones que CATALOGO-DE-INVENTARIO)
  login:(correo,pin)=>post(CATALOGO_API,{action:'login',app:'catalogo',correo,codigoAcceso:pin,dispositivo:navigator.userAgent.slice(0,180),recordarme:true}),
  inventario:(correo,token)=>post(CATALOGO_API,{action:'obtenerInventario',correo,token})
};
