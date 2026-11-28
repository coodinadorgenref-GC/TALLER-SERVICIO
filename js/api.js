// Cliente REST. Desde v57 el Taller ya no tiene Apps Script propio: todas sus acciones van al API principal (Worker de Cloudflare) con la sesión del usuario (correo + token).
// Excepción: el enlace del cliente (cliente.html: verOrden, fotoCliente, autorizarCliente) no lleva sesión; el servidor lo protege con el token de cada orden.
const CATALOGO_API="https://catalogo-labarata-proxy.catalogo-labarata.workers.dev";
const TALLER_CLAVE=''; // ya no se usa: la sesión reemplaza a la clave compartida
const claveT=()=>{try{return localStorage.getItem('taller_clave')||TALLER_CLAVE}catch{return TALLER_CLAVE}};
async function post(url,body){const r=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body)});return r.json()}
const api={
  taller:b=>{const s=(typeof sesion!=='undefined'&&sesion)||null;return post(CATALOGO_API,Object.assign({},b,s?{correo:s.correo,token:s.token}:{}))},
  // Catálogo existente (mismas acciones que CATALOGO-DE-INVENTARIO)
  login:(correo,pin,rec=true)=>post(CATALOGO_API,{action:'login',app:'catalogo',correo,codigoAcceso:pin,dispositivo:navigator.userAgent.slice(0,180),recordarme:rec}),
  inventario:(correo,token)=>post(CATALOGO_API,{action:'obtenerInventario',correo,token}),
  // Lista de precios públicos del catálogo, ya con IVA
  precios:(correo,token)=>post(CATALOGO_API,{action:'obtenerPreciosCatalogo',correo,token})
};
