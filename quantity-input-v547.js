
(function(){
'use strict';
const STYLE_ID='yak547-qty-style';
function addStyle(){
 if(document.getElementById(STYLE_ID)) return;
 const s=document.createElement('style'); s.id=STYLE_ID;
 s.textContent=`
 .yak547-qty-wrap{display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap}
 .yak547-qty-input{width:78px;min-width:64px;padding:7px 8px;border-radius:8px;border:1px solid #555;background:#202127;color:inherit;font:inherit}
 .yak547-qty-add{padding:7px 10px;border:0;border-radius:8px;background:#f58220;color:#fff;font-weight:700;cursor:pointer}
 .yak547-qty-hint{font-size:11px;opacity:.72}
 `;
 document.head.appendChild(s);
}
function productId(p){return String(p.id ?? p.productId ?? p.code ?? p.sku ?? '');}
function findProductCard(el){
 return el.closest('[data-product-id],.product-card,.product-item,.pos-product,.product-tile,.product');
}
function findProduct(card){
 if(!card) return null;
 const id=card.dataset.productId || card.dataset.id;
 const arr=(typeof db!=='undefined' && Array.isArray(db.products))?db.products:[];
 if(id){ const p=arr.find(x=>productId(x)===String(id)); if(p) return p; }
 const text=(card.querySelector('h1,h2,h3,h4,.product-name,.name')?.textContent||'').trim();
 return arr.find(p=>String(p.name||p.title||'').trim()===text) || null;
}
function addQuantityUI(){
 if(typeof db==='undefined' || !Array.isArray(db.products)) return;
 const cards=[...document.querySelectorAll('[data-product-id],.product-card,.product-item,.pos-product,.product-tile,.product')];
 for(const card of cards){
   if(card.querySelector('.yak547-qty-wrap')) continue;
   const p=findProduct(card);
   if(!p) continue;
   const wrap=document.createElement('div'); wrap.className='yak547-qty-wrap';
   const input=document.createElement('input'); input.className='yak547-qty-input';
   input.type='number'; input.min='1'; input.step='1'; input.value='1';
   input.setAttribute('aria-label','จำนวนที่ต้องการขาย');
   input.addEventListener('click',e=>e.stopPropagation());
   input.addEventListener('keydown',e=>e.stopPropagation());
   const btn=document.createElement('button'); btn.type='button'; btn.className='yak547-qty-add'; btn.textContent='เพิ่มตามจำนวน';
   btn.addEventListener('click',e=>{
     e.preventDefault(); e.stopPropagation();
     const qty=Math.floor(Number(input.value));
     if(!Number.isFinite(qty)||qty<1){ alert('กรุณาใส่จำนวนอย่างน้อย 1'); input.focus(); return; }
     const clickable=card.matches('button')?card:card.querySelector('button,[role="button"]');
     if(!clickable){ alert('ไม่พบปุ่มเพิ่มสินค้าของระบบเดิม'); return; }
     for(let i=0;i<qty;i++) clickable.click();
     input.value='1';
   });
   const hint=document.createElement('span'); hint.className='yak547-qty-hint'; hint.textContent='จำนวน';
   wrap.append(hint,input,btn);
   card.appendChild(wrap);
 }
}
function observe(){
 addStyle(); addQuantityUI();
 const obs=new MutationObserver(()=>addQuantityUI());
 obs.observe(document.body,{childList:true,subtree:true});
 window.YAK_POS_QTY_547={refresh:addQuantityUI};
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe);
else observe();
})();
