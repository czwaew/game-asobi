
const DB_KEY='jaWorkPortalDataV1';
const SESSION_KEY='jaWorkPortalSession';
const blankData={farmers:[],machinery:[],shifts:[],reports:[],inventory:[],deliveries:[],visits:[],training:[]};
let data=loadData(), deferredPrompt=null, isAdmin=false;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const today=()=>new Date().toISOString().slice(0,10);
function loadData(){try{return {...blankData,...JSON.parse(localStorage.getItem(DB_KEY)||'{}')}}catch{return structuredClone(blankData)}}
function saveData(){localStorage.setItem(DB_KEY,JSON.stringify(data));renderAll()}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2400)}
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fileToDataURL(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function formObject(form){return Object.fromEntries(new FormData(form).entries())}
function removeItem(key,id){data[key]=data[key].filter(x=>x.id!==id);saveData();toast('削除しました')}
window.removeItem=removeItem; window.printPage=()=>window.print();

function showPage(id){
  $$('.page').forEach(x=>x.classList.toggle('active',x.id===id));
  $$('#bottomNav [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
  $('#moreMenu').classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'});
  if(id==='admin'&&!isAdmin) toast('一般職員は閲覧のみのデモ表示です');
}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('#moreBtn').addEventListener('click',()=>$('#moreMenu').classList.toggle('hidden'));

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#loginId').value==='staff'&&$('#loginPassword').value==='1234'){
    isAdmin=$('#adminLogin').checked;
    sessionStorage.setItem(SESSION_KEY,JSON.stringify({admin:isAdmin}));
    $('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');init();
  }else toast('職員IDまたはパスワードが違います')
});
$('#logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem(SESSION_KEY);location.reload()});
const existing=sessionStorage.getItem(SESSION_KEY);
if(existing){isAdmin=JSON.parse(existing).admin;$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');setTimeout(init)}

function init(){
  $('#todayLabel').textContent=new Intl.DateTimeFormat('ja-JP',{dateStyle:'full'}).format(new Date());
  $$('input[type=date]').forEach(i=>{if(!i.value)i.value=today()});
  $('#adminStatus').textContent=isAdmin?'管理者としてログイン中です。':'一般職員としてログイン中です。';
  renderAll(); checkDeadlines();
}

const forms=[
 ['farmerForm','farmers'],['machineryForm','machinery'],['shiftForm','shifts'],['reportForm','reports'],
 ['inventoryForm','inventory'],['deliveryForm','deliveries'],['visitForm','visits'],['trainingForm','training']
];
forms.forEach(([fid,key])=>{
  $('#'+fid).addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,obj=formObject(form);
    const photo=form.querySelector('[name=photo]')?.files?.[0]; if(photo)obj.photo=await fileToDataURL(photo);
    obj.id=crypto.randomUUID();obj.createdAt=new Date().toISOString();data[key].unshift(obj);saveData();form.reset();
    form.querySelectorAll('input[type=date]').forEach(i=>i.value=today());toast('保存しました');
  });
});

$$('[data-geo-target]').forEach(btn=>btn.addEventListener('click',()=>{
  if(!navigator.geolocation)return toast('この端末は位置情報に対応していません');
  btn.disabled=true;btn.textContent='位置を取得中…';
  navigator.geolocation.getCurrentPosition(pos=>{
    const form=$('#'+btn.dataset.geoTarget);form.elements.location.value=`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    btn.disabled=false;btn.textContent='📍 GPS位置記録';toast('現在地を記録しました');
  },()=>{btn.disabled=false;btn.textContent='📍 GPS位置記録';toast('位置情報を取得できませんでした')},{enableHighAccuracy:true,timeout:10000});
}));

function table(el,headers,rows){
  $(el).innerHTML=rows.length?`<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`:`<div class="empty">登録データはありません</div>`;
}
function renderAll(){
  table('#farmerResults',['氏名','地区','電話','作物','位置','操作'],data.farmers.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.area)}</td><td>${escapeHtml(x.phone)}</td><td>${escapeHtml(x.crop)}</td><td>${escapeHtml(x.location)}</td><td><button class="mini-btn" onclick="removeItem('farmers','${x.id}')">削除</button></td></tr>`));
  table('#machineryList',['写真','農機','所有者','点検日','次回','状態','内容','操作'],data.machinery.map(x=>`<tr><td>${x.photo?`<img src="${x.photo}" alt="">`:'—'}</td><td>${escapeHtml(x.machine)}</td><td>${escapeHtml(x.owner)}</td><td>${x.date||''}</td><td>${x.nextDate||''}</td><td><span class="badge">${escapeHtml(x.status)}</span></td><td>${escapeHtml(x.detail)}</td><td><button class="mini-btn" onclick="removeItem('machinery','${x.id}')">削除</button></td></tr>`));
  table('#shiftList',['日付','区分','開始','終了','備考','操作'],data.shifts.map(x=>`<tr><td>${x.date}</td><td>${x.type}</td><td>${x.start||'—'}</td><td>${x.end||'—'}</td><td>${escapeHtml(x.note)}</td><td><button class="mini-btn" onclick="removeItem('shifts','${x.id}')">削除</button></td></tr>`));
  table('#reportList',['日付','担当','訪問','取扱額','作業内容','引継ぎ','操作'],data.reports.map(x=>`<tr><td>${x.date}</td><td>${escapeHtml(x.staff)}</td><td>${x.visits||0}件</td><td>¥${Number(x.sales||0).toLocaleString()}</td><td>${escapeHtml(x.work)}</td><td>${escapeHtml(x.handover)}</td><td><button class="mini-btn" onclick="removeItem('reports','${x.id}')">削除</button></td></tr>`));
  table('#inventoryList',['品名','分類','在庫','発注点','保管場所','状態','操作'],data.inventory.map(x=>`<tr><td>${escapeHtml(x.item)}</td><td>${escapeHtml(x.category)}</td><td>${x.quantity}</td><td>${x.threshold}</td><td>${escapeHtml(x.location)}</td><td><span class="badge ${+x.quantity<=+x.threshold?'alert':''}">${+x.quantity<=+x.threshold?'要発注':'適正'}</span></td><td><button class="mini-btn" onclick="removeItem('inventory','${x.id}')">削除</button></td></tr>`));
  table('#deliveryList',['日付','配送先','品目','担当','状態','位置','操作'],data.deliveries.map(x=>`<tr><td>${x.date}</td><td>${escapeHtml(x.destination)}</td><td>${escapeHtml(x.item)}</td><td>${escapeHtml(x.driver)}</td><td><span class="badge">${x.status}</span></td><td>${escapeHtml(x.location)}</td><td><button class="mini-btn" onclick="removeItem('deliveries','${x.id}')">削除</button></td></tr>`));
  table('#visitList',['写真','日付','農家','担当','相談','対応','位置','操作'],data.visits.map(x=>`<tr><td>${x.photo?`<img src="${x.photo}" alt="">`:'—'}</td><td>${x.date}</td><td>${escapeHtml(x.farmer)}</td><td>${escapeHtml(x.staff)}</td><td>${escapeHtml(x.consultation)}</td><td>${escapeHtml(x.response)}</td><td>${escapeHtml(x.location)}</td><td><button class="mini-btn" onclick="removeItem('visits','${x.id}')">削除</button></td></tr>`));
  table('#trainingList',['名称','日時','場所','状況','備考','操作'],data.training.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${(x.date||'').replace('T',' ')}</td><td>${escapeHtml(x.place)}</td><td><span class="badge">${x.status}</span></td><td>${escapeHtml(x.note)}</td><td><button class="mini-btn" onclick="removeItem('training','${x.id}')">削除</button></td></tr>`));
  renderDashboard();renderAdmin();
}
function renderDashboard(){
  const due=data.machinery.filter(x=>x.nextDate&&new Date(x.nextDate)<=new Date(Date.now()+7*86400000));
  const low=data.inventory.filter(x=>+x.quantity<=+x.threshold);
  const cards=[['農家登録',data.farmers.length+'件'],['今月の日報',monthItems(data.reports).length+'件'],['点検期限',due.length+'件'],['要発注',low.length+'件']];
  $('#summaryCards').innerHTML=cards.map(([a,b])=>`<div class="summary"><b>${b}</b><span>${a}</span></div>`).join('');
  $('#deadlineList').innerHTML=due.length?due.map(x=>`<div class="list-item"><b>${escapeHtml(x.machine)}</b><br><span class="badge alert">${x.nextDate}</span> ${escapeHtml(x.owner||'')}</div>`).join(''):'<div class="empty">7日以内の点検期限はありません</div>';
  drawChart();
}
function monthItems(arr){const m=today().slice(0,7);return arr.filter(x=>(x.date||x.createdAt||'').slice(0,7)===m)}
function drawChart(){
  const c=$('#monthlyChart'),ctx=c.getContext('2d'),items=[
    ['農機',monthItems(data.machinery).length],['日報',monthItems(data.reports).length],['配送',monthItems(data.deliveries).length],['訪問',monthItems(data.visits).length],['研修',monthItems(data.training).length]
  ];ctx.clearRect(0,0,c.width,c.height);const max=Math.max(1,...items.map(x=>x[1])),base=250,w=90,gap=45;
  ctx.font='16px sans-serif';ctx.textAlign='center';
  items.forEach((it,i)=>{const h=180*it[1]/max,x=55+i*(w+gap);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--primary2');ctx.fillRect(x,base-h,w,h);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text');ctx.fillText(it[1],x+w/2,base-h-10);ctx.fillText(it[0],x+w/2,278)});
}
function renderAdmin(){
  const labels={farmers:'農家',machinery:'農機点検',shifts:'シフト',reports:'日報',inventory:'在庫',deliveries:'配送',visits:'営農訪問',training:'会議・研修'};
  $('#adminCounts').innerHTML=Object.entries(labels).map(([k,v])=>`<div class="summary"><b>${data[k].length}</b><span>${v}</span></div>`).join('');
}
$('#farmerQuery').addEventListener('input',filterFarmers);$('#searchFarmerBtn').addEventListener('click',filterFarmers);
function filterFarmers(){const q=$('#farmerQuery').value.toLowerCase();const orig=data.farmers;data.farmers=orig.filter(x=>Object.values(x).join(' ').toLowerCase().includes(q));renderAll();data.farmers=orig}
$('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('jaTheme',document.body.classList.contains('dark')?'dark':'light');drawChart()});
if(localStorage.getItem('jaTheme')==='dark')document.body.classList.add('dark');

$('#notifyBtn').addEventListener('click',async()=>{if(!('Notification'in window))return toast('通知に対応していません');const p=await Notification.requestPermission();toast(p==='granted'?'通知を有効にしました':'通知が許可されませんでした');checkDeadlines()});
function checkDeadlines(){
  const due=data.machinery.filter(x=>x.nextDate&&new Date(x.nextDate)<=new Date(Date.now()+86400000));
  if(due.length&&Notification.permission==='granted')new Notification('農機点検期限のお知らせ',{body:`期限が近い点検が${due.length}件あります。`,icon:'icon.svg'});
}
$('#backupBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ja-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)});
$('#restoreInput').addEventListener('change',async e=>{try{data={...blankData,...JSON.parse(await e.target.files[0].text())};saveData();toast('バックアップを復元しました')}catch{toast('読み込みに失敗しました')}});
$('#clearBtn').addEventListener('click',()=>{if(!isAdmin)return toast('管理者ログインが必要です');if(confirm('全データを削除しますか？')){data=structuredClone(blankData);saveData();toast('初期化しました')}});

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').classList.add('hidden')});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
