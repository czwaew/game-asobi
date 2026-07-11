const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
let tasks=JSON.parse(localStorage.tsubameTasks||'[]');
let memos=JSON.parse(localStorage.tsubameMemos||'[]');

function tick(){const d=new Date();$('clock').textContent=d.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'});}setInterval(tick,1000);tick();
function save(){localStorage.tsubameTasks=JSON.stringify(tasks);localStorage.tsubameMemos=JSON.stringify(memos)}
function stamp(){return new Date().toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}

function render(){
  $('tasks').innerHTML=tasks.map((t,i)=>`<li class="task-item ${t.done?'done':''}"><button class="task-check" onclick="toggle(${i})" aria-label="完了状態を変更">${t.done?'✓':''}</button><div class="task-text" onclick="toggle(${i})"><strong>${esc(t.text)}</strong><small>${esc(t.time)}</small></div><button class="delete-btn" onclick="delTask(${i})" aria-label="削除">削除</button></li>`).join('');
  $('memos').innerHTML=memos.map((m,i)=>`<article class="memo"><div class="memo-head"><b>${esc(m.member)}</b><span>${esc(m.category)}</span></div><p>${esc(m.memo)}</p><small>${esc(m.time)}</small></article>`).join('');
  $('taskEmpty').hidden=tasks.length>0;$('memoEmpty').hidden=memos.length>0;
  $('openCount').textContent=tasks.filter(t=>!t.done).length;$('doneCount').textContent=tasks.filter(t=>t.done).length;$('memoCount').textContent=memos.length;
}
function addTask(text){tasks.unshift({text,done:false,time:stamp()});save();render();}
function addCustomTask(){const v=$('taskInput').value.trim();if(!v){$('taskInput').focus();return}addTask(v);$('taskInput').value='';}
function toggle(i){tasks[i].done=!tasks[i].done;save();render();}
function delTask(i){tasks.splice(i,1);save();render();}
function clearDone(){if(!tasks.some(t=>t.done))return alert('完了済みのタスクはありません。');tasks=tasks.filter(t=>!t.done);save();render();}
function saveMemo(){const memo=$('memo').value.trim();if(!memo)return alert('対応内容を入力してください。');memos.unshift({member:$('member').value.trim()||'受付記録',category:$('category').value,memo,time:stamp()});$('member').value='';$('memo').value='';save();render();}
function exportCSV(){const rows=[['種類','分類','名前・内容','状態・詳細','日時'],...tasks.map(t=>['タスク','業務',t.text,t.done?'完了':'未完了',t.time]),...memos.map(m=>['対応メモ',m.category,m.member,m.memo,m.time])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='tsubame_dx_demo_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function goTo(id){document.getElementById(id).scrollIntoView({behavior:'smooth',block:'start'});}
function openModal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').hidden=false;}
function closeModal(){$('modal').hidden=true;}
function showGuide(){openModal('窓口案内の標準化','<p>担当者ごとの差を減らすための案内例です。</p><ol><li>相談内容と本人確認の要否を確認</li><li>担当課・必要書類・手続期限を案内</li><li>対応内容をメモし、必要に応じて引継ぎ</li></ol><p><small>本格導入時は燕市の業務フローに合わせて設定できます。</small></p>');}
function showEmergency(){openModal('緊急時の初動確認','<ol><li>安全確保と緊急性の確認</li><li>所属部署の責任者へ直ちに連絡</li><li>消防・警察など関係機関への通報</li><li>時刻・状況・対応内容を記録</li></ol><p><small>実運用では燕市の正式な危機管理マニュアルを登録します。</small></p>');}
$('taskInput').addEventListener('keydown',e=>{if(e.key==='Enter')addCustomTask()});
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
render();