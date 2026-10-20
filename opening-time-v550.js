(function(){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const weekdays=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
function validSales(){
 if(typeof db==='undefined'||!Array.isArray(db.sales))return [];
 return db.sales.filter(s=>{const d=new Date(s.date);return !isNaN(d.getTime()) && d.getTime()<=Date.now() && s.voided!==true && s.status!=='void' && s.status!=='cancelled';});
}
function analyze(sales){
 const days=new Map(),hours=Array(24).fill(0),halfHours=Array(48).fill(0);
 sales.forEach(s=>{
  const d=new Date(s.date),key=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  if(!days.has(key))days.set(key,[]);
  days.get(key).push(d);
  hours[d.getHours()]++;halfHours[d.getHours()*2+Math.floor(d.getMinutes()/30)]++;
 });
 const first=Array(48).fill(0),firstTimes=[];
 days.forEach(arr=>{arr.sort((a,b)=>a-b);const d=arr[0];first[d.getHours()*2+Math.floor(d.getMinutes()/30)]++;firstTimes.push(d.getHours()*60+d.getMinutes());});
 const peak=(arr)=>arr.reduce((best,n,i)=>n>arr[best]?i:best,0);
 const firstSlot=peak(first),busySlot=peak(halfHours);
 const fmt=i=>`${pad(Math.floor(i/2))}:${i%2?'30':'00'}`;
 const q=firstTimes.sort((a,b)=>a-b);const median=q.length?q[Math.floor((q.length-1)/2)]:null;
 return {days:days.size,bills:sales.length,firstSlot,busySlot,firstCount:first[firstSlot],busyCount:halfHours[busySlot],first,halfHours,hours,median,fmt};
}
function render(){
 const el=document.getElementById('yak550Opening');if(!el)return;
 const branch=document.getElementById('yak550Branch'),weekday=document.getElementById('yak550Weekday');
 if(typeof db==='undefined'||!db)return;
 const branches=Array.isArray(db.branches)?db.branches:[];
 const selected=branch.value;
 branch.innerHTML='<option value="">ทุกสาขา</option>'+branches.map(b=>`<option value="${String(b.id).replace(/"/g,'&quot;')}">${String(b.name||b.code||b.id).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
 branch.value=selected;
 const w=weekday.value;
 const sales=validSales().filter(s=>(!branch.value||String(s.branchId)===branch.value)&&(!w||String(new Date(s.date).getDay())===w));
 const a=analyze(sales),result=document.getElementById('yak550Result');
 if(!a.bills){result.innerHTML='<p>ยังไม่มีประวัติการขายสำหรับตัวกรองนี้</p>';return;}
 const topSlots=a.halfHours.map((count,i)=>({i,count})).filter(x=>x.count>0).sort((x,y)=>y.count-x.count||x.i-y.i).slice(0,8);
 const peakMax=Math.max(1,...a.halfHours);
 const peakRows=topSlots.map((x,rank)=>`<div class="yak550-bar"><span>${rank+1}. ${a.fmt(x.i)}–${a.fmt(x.i+1)}</span><div><i style="width:${Math.round(x.count/peakMax*100)}%"></i></div><strong>${x.count} บิล (${(x.count/a.bills*100).toFixed(1)}%)</strong></div>`).join('');
 const recommended=a.median===null?'—':`${pad(Math.floor(Math.max(0,a.median-30)/60))}:${pad(Math.max(0,a.median-30)%60)}`;
 result.innerHTML=`<h3>🏆 ช่วงเวลาที่มีการเปิดบิลมากที่สุด</h3><p><strong>${a.fmt(a.busySlot)}–${a.fmt(a.busySlot+1)} น.</strong> มี ${a.busyCount} บิล จากทั้งหมด ${a.bills} บิล (${(a.busyCount/a.bills*100).toFixed(1)}%)</p><p class="yak550-note">อันดับช่วงเวลาเปิดบิลที่มากที่สุด แบ่งทุก 30 นาที นับ 1 บิลเป็น 1 ครั้ง ไม่ใช่จำนวนสินค้า</p><div class="yak550-bars">${peakRows}</div><div class="yak550-stats"><div><small>วันที่มีบิล</small><b>${a.days} วัน</b></div><div><small>จำนวนบิล</small><b>${a.bills} บิล</b></div><div><small>ช่วงบิลแรกที่พบบ่อยสุด</small><b>${a.fmt(a.firstSlot)}–${a.fmt(a.firstSlot+1)}</b><small>${a.firstCount} วัน</small></div><div><small>ช่วงที่มีบิลหนาแน่นสุด</small><b>${a.fmt(a.busySlot)}–${a.fmt(a.busySlot+1)}</b><small>${a.busyCount} บิล</small></div></div><p><strong>เวลาเปิดร้านเพื่อทดลอง:</strong> ประมาณ ${recommended} น. (ก่อนค่ามัธยฐานของเวลาบิลแรก 30 นาที)</p><p class="yak550-note">นี่เป็นเวลาแนะนำเบื้องต้น ไม่ใช่การยืนยันเวลาที่ลูกค้าเดินเข้าร้านจริง ข้อมูลนับเฉพาะวันที่มีบิล และไม่รวมวันที่เปิดร้านแต่ขายไม่ได้</p><h4>จำนวนบิลรายชั่วโมง</h4><div class="yak550-bars">${a.hours.map((n,i)=>`<div class="yak550-bar"><span>${pad(i)}:00</span><div><i style="width:${Math.max(0,n/Math.max(1,...a.hours)*100)}%"></i></div><strong>${n}</strong></div>`).join('')}</div><h4>การกระจายเวลาบิลแรก (ช่วงละ 30 นาที)</h4><div class="yak550-bars">${a.first.map((n,i)=>n?`<div class="yak550-bar"><span>${a.fmt(i)}</span><div><i style="width:${Math.round(n/a.days*100)}%"></i></div><strong>${n} วัน</strong></div>`:'').join('')}</div>`;
}
function init(){const host=document.getElementById('tab-reports');if(!host)return;
 const box=document.createElement('section');box.id='yak550Opening';box.className='panel yak550-panel';
 box.innerHTML='<h2>🕒 วิเคราะห์เวลาเปิดร้าน (แอดมิน)</h2><p>จัดอันดับช่วงเวลาที่เปิดบิลมากที่สุด (ทุก 30 นาที) จากประวัติการขาย พร้อมวิเคราะห์บิลแรกเพื่อช่วยวางเวลาเปิดร้าน</p><div class="yak550-controls"><label>สาขา <select id="yak550Branch"><option value="">ทุกสาขา</option></select></label><label>วันในสัปดาห์ <select id="yak550Weekday"><option value="">ทุกวัน</option>'+weekdays.map((d,i)=>`<option value="${i}">${d}</option>`).join('')+'</select></label><button type="button" id="yak550Refresh">วิเคราะห์ใหม่</button></div><div id="yak550Result"></div>';
 host.insertBefore(box,host.firstChild);
 document.getElementById('yak550Branch').addEventListener('change',render);
 document.getElementById('yak550Weekday').addEventListener('change',render);
 document.getElementById('yak550Refresh').addEventListener('click',render);
 render();window.YAK_OPENING_ANALYTICS_550={render,analyze};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
