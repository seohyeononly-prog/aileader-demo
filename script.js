const app=document.querySelector('#app');
const toast=document.querySelector('#toast');
const DB_KEY='surveyflow-demo-v2';

function iso(date){return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function plus(date,days){const copy=new Date(date);copy.setDate(copy.getDate()+days);return copy}
function seed(){
  const now=new Date();
  return {
    students:[
      {id:'stu-1',cohort:'AI리더 3기',name:'김민지',password:'1234'},
      {id:'stu-2',cohort:'AI리더 3기',name:'박서준',password:'5678'},
      {id:'stu-3',cohort:'AI리더 3기',name:'이하은',password:'2468'},
      {id:'stu-4',cohort:'AI리더 3기',name:'최도윤',password:'1357'},
      {id:'stu-5',cohort:'AI리더 2기',name:'정수아',password:'7777'}
    ],
    surveys:[
      {id:'week-01',title:'1주차 학습 만족도 조사',date:iso(plus(now,-8)),deadline:iso(plus(now,-6)),url:'https://form.typeform.com/to/G7D8cC1I',sheet:'https://docs.google.com/spreadsheets/d/demo-weekly-sheet',cohort:'AI리더 3기'},
      {id:'week-02',title:'2주차 프로젝트 회고',date:iso(plus(now,-1)),deadline:iso(plus(now,1)),url:'https://form.typeform.com/to/G7D8cC1I',sheet:'https://docs.google.com/spreadsheets/d/demo-weekly-sheet',cohort:'AI리더 3기'},
      {id:'week-03',title:'3주차 운영 설문',date:iso(plus(now,6)),deadline:iso(plus(now,8)),url:'https://form.typeform.com/to/G7D8cC1I',sheet:'https://docs.google.com/spreadsheets/d/demo-weekly-sheet',cohort:'AI리더 3기'}
    ],
    submissions:[
      {surveyId:'week-01',studentId:'stu-1',submittedAt:iso(plus(now,-7))},
      {surveyId:'week-01',studentId:'stu-2',submittedAt:iso(plus(now,-7))},
      {surveyId:'week-01',studentId:'stu-3',submittedAt:iso(plus(now,-7))},
      {surveyId:'week-02',studentId:'stu-1',submittedAt:iso(now)}
    ]
  };
}
function normalizeCohort(value){
  const compact=String(value||'').trim().replace(/\s+/g,' ');
  return compact.replace(/^AI\s*리더\s*/i,'AI리더 ');
}
let db;try{db=JSON.parse(localStorage.getItem(DB_KEY))||seed()}catch(error){db=seed()}
db.students.forEach(function(student){student.cohort=normalizeCohort(student.cohort)});
db.surveys.forEach(function(survey){survey.cohort=normalizeCohort(survey.cohort)});
save();
let session=null,loginRole='student',month=new Date(),adminView='calendar';
function save(){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function say(message){toast.textContent=message;toast.classList.add('show');clearTimeout(say.timer);say.timer=setTimeout(function(){toast.classList.remove('show')},2300)}
function labelMonth(date){return date.getFullYear()+'년 '+(date.getMonth()+1)+'월'}
function koDate(value){return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(value+'T00:00:00'))}
function id(prefix){return prefix+'-'+Date.now().toString(36)}
function targets(cohort){return db.students.filter(function(s){return s.cohort===cohort})}
function cohortOptions(selected){
  const cohorts=['AI리더 1기','AI리더 2기','AI리더 3기'];
  db.students.concat(db.surveys).forEach(function(item){const value=normalizeCohort(item.cohort);if(value&&!cohorts.includes(value))cohorts.push(value)});
  return cohorts.map(function(value){return'<option value="'+esc(value)+'" '+(value===normalizeCohort(selected)?'selected':'')+'>'+esc(value)+'</option>'}).join('');
}
function submitted(surveyId,studentId){return db.submissions.some(function(item){return item.surveyId===surveyId&&item.studentId===studentId})}
function validForm(value){try{const typed=value.trim();const url=new URL(typed.startsWith('http')?typed:'https://'+typed);return url.hostname==='form.typeform.com'||url.hostname.endsWith('.typeform.com')}catch(error){return false}}
function typeformId(value){
  try{
    const typed=value.trim(),url=new URL(typed.startsWith('http')?typed:'https://'+typed),parts=url.pathname.split('/').filter(Boolean);
    const marker=parts.indexOf('to')>=0?parts.indexOf('to'):parts.indexOf('form');
    return marker>=0?parts[marker+1]||'':'';
  }catch(error){return''}
}
function embedUrl(survey,student){
  const formId=typeformId(survey.url);if(!formId)return'';
  const params=new URLSearchParams();params.set('pid',student.id);params.set('assignment_id',survey.id);params.set('student_name',student.name);
  return 'https://form.typeform.com/to/'+encodeURIComponent(formId)+'#'+params.toString();
}
function markSubmitted(survey,student,responseId){
  if(!submitted(survey.id,student.id))db.submissions.push({surveyId:survey.id,studentId:student.id,submittedAt:iso(new Date()),responseId:responseId||''});
  save();
}

function renderLogin(){
  const admin=loginRole==='admin';
  app.innerHTML='<main class="app-login"><section class="login-brand"><div class="brand"><span class="brand-mark">S</span>SurveyFlow</div><div class="brand-copy"><p class="kicker">SURVEY OPERATIONS, SIMPLIFIED</p><h1>설문 일정부터<br><span>제출 확인까지.</span></h1><p>운영진과 수강생이 하나의 캘린더에서 설문 일정을 확인하고, 놓치지 않도록 관리하세요.</p></div><div class="brand-foot">SURVEYFLOW · DEMO VERSION</div></section><section class="login-panel"><div class="login-card"><h2>다시 만나서 반가워요</h2><p class="sub">계정으로 로그인해 설문 일정을 확인하세요.</p><div class="role-tabs"><button data-role="student" class="'+(!admin?'active':'')+'">수강생</button><button data-role="admin" class="'+(admin?'active':'')+'">운영진</button></div><form id="login-form"><div class="field"><label for="login-id">'+(admin?'아이디':'이름')+'</label><input id="login-id" autocomplete="username" value="'+(admin?'admin':'김민지')+'"></div><div class="field"><label for="login-password">비밀번호</label><input id="login-password" type="password" value="'+(admin?'1234':'1234')+'"></div><p id="login-error" class="login-error"></p><button class="login-submit">'+(admin?'운영진으로 로그인':'수강생으로 로그인')+'</button></form><p class="demo-hint">데모 계정 · '+(admin?'운영진 <b>admin / 1234</b>':'수강생 <b>김민지 / 1234</b>')+'</p></div></section></main>';
  app.querySelectorAll('[data-role]').forEach(function(btn){btn.onclick=function(){loginRole=btn.dataset.role;renderLogin()}});
  app.querySelector('#login-form').onsubmit=function(event){
    event.preventDefault();const name=app.querySelector('#login-id').value.trim(),password=app.querySelector('#login-password').value;
    if(admin&&name==='admin'&&password==='1234'){session={role:'admin',name:'운영진'};month=new Date();renderAdmin();return}
    const student=db.students.find(function(s){return s.name===name&&s.password===password});
    if(!admin&&student){session={role:'student',studentId:student.id,name:student.name};month=new Date();renderStudent();return}
    app.querySelector('#login-error').textContent='아이디 또는 비밀번호를 다시 확인해 주세요.';
  };
}

function calendarHtml(surveys,student){
  const year=month.getFullYear(),m=month.getMonth(),first=new Date(year,m,1),start=new Date(year,m,1-first.getDay()),today=iso(new Date());
  let html='<div class="calendar">';
  ['일','월','화','수','목','금','토'].forEach(function(day,index){html+='<div class="weekday '+(index===0?'sun':'')+'">'+day+'</div>'});
  for(let index=0;index<42;index++){
    const date=plus(start,index),dateKey=iso(date),items=surveys.filter(function(s){return s.date===dateKey});
    html+='<div class="day '+(date.getMonth()!==m?'other ':'')+(dateKey===today?'today':'')+'" data-date="'+dateKey+'"><span class="day-num">'+date.getDate()+'</span>';
    items.slice(0,2).forEach(function(survey){
      let style='',meta='';
      if(student){const done=submitted(survey.id,student.id);style=done?'done':survey.deadline<today?'overdue':'';meta=done?'제출 완료':'마감 '+survey.deadline.slice(5).replace('-','.')}
      else{const count=db.submissions.filter(function(item){return item.surveyId===survey.id}).length;meta=count+'/'+targets(survey.cohort).length+'명 제출'}
      html+='<button class="event '+style+'" data-survey="'+survey.id+'">'+esc(survey.title)+'<span class="event-meta">'+meta+'</span></button>';
    });
    if(items.length>2)html+='<span class="event">+'+(items.length-2)+'개 더보기</span>';
    html+='</div>';
  }
  return html+'</div>';
}

function adminShell(content,title,sub){
  return '<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">S</span>SurveyFlow</div><p class="nav-label">WORKSPACE</p><nav class="nav"><button data-view="calendar" class="'+(adminView==='calendar'?'active':'')+'"><span class="ico">▦</span>설문 캘린더</button><button data-view="students" class="'+(adminView==='students'?'active':'')+'"><span class="ico">♙</span>수강생 관리</button></nav><div class="sidebar-bottom"><div class="profile"><span class="avatar">AD</span><div><strong>운영진</strong><small>Administrator</small></div></div><button class="logout" data-logout>로그아웃 →</button></div></aside><main class="workspace"><header class="topbar"><div><h1>'+title+'</h1><p>'+sub+'</p></div><div class="top-actions">'+(adminView==='calendar'?'<button class="secondary-btn" data-reset>데모 초기화</button><button class="primary-btn" data-new>＋ 설문 등록</button>':'<button class="primary-btn" data-bulk>＋ 수강생 등록</button>')+'</div></header>'+content+'</main></div>';
}
function bindAdmin(){
  app.querySelectorAll('[data-view]').forEach(function(btn){btn.onclick=function(){adminView=btn.dataset.view;renderAdmin()}});
  app.querySelector('[data-logout]').onclick=function(){session=null;renderLogin()};
  const add=app.querySelector('[data-new]');if(add)add.onclick=function(){editSurvey(null,iso(new Date()))};
  const reset=app.querySelector('[data-reset]');if(reset)reset.onclick=function(){db=seed();save();say('데모 데이터가 초기화되었습니다.');renderAdmin()};
}
function renderAdmin(){
  if(adminView==='students'){renderStudents();return}
  const current=db.surveys.filter(function(s){const d=new Date(s.date+'T00:00:00');return d.getFullYear()===month.getFullYear()&&d.getMonth()===month.getMonth()});
  const allTargets=db.surveys.reduce(function(total,s){return total+targets(s.cohort).length},0);
  const stats='<section class="stats"><article class="stat"><span>이번 달 설문</span><strong>'+current.length+'<small>개</small></strong></article><article class="stat" style="--stat-soft:#e5f7f1"><span>등록 수강생</span><strong>'+db.students.length+'<small>명</small></strong></article><article class="stat" style="--stat-soft:#fff0e6"><span>누적 제출</span><strong>'+db.submissions.length+'<small>건</small></strong></article><article class="stat"><span>전체 제출률</span><strong>'+(allTargets?Math.round(db.submissions.length/allTargets*100):0)+'<small>%</small></strong></article></section>';
  const activities=db.surveys.slice().sort(function(a,b){return b.date.localeCompare(a.date)}).slice(0,4).map(function(s){const count=db.submissions.filter(function(x){return x.surveyId===s.id}).length;return'<div class="activity"><span class="badge">✓</span><div><p>'+esc(s.title)+'</p><small>'+count+'/'+targets(s.cohort).length+'명 제출 · '+esc(s.cohort)+'</small></div></div>'}).join('');
  const content=stats+'<div class="admin-grid"><section class="panel calendar-panel"><div class="calendar-head"><div class="month-nav"><button class="icon-btn" data-month="-1">‹</button><h2>'+labelMonth(month)+'</h2><button class="icon-btn" data-month="1">›</button></div><div class="legend"><span><i class="dot"></i>설문 일정</span><span><i class="dot due"></i>마감 지남</span></div></div>'+calendarHtml(db.surveys)+'</section><aside class="panel side-card"><h3>최근 설문 현황</h3>'+activities+'</aside></div>';
  app.innerHTML=adminShell(content,'설문 캘린더','날짜를 클릭해 설문을 등록하고 제출 현황을 확인하세요.');
  bindAdmin();
  app.querySelectorAll('[data-month]').forEach(function(btn){btn.onclick=function(){month.setMonth(month.getMonth()+Number(btn.dataset.month));renderAdmin()}});
  app.querySelectorAll('.day').forEach(function(day){day.onclick=function(event){if(!event.target.closest('.event'))editSurvey(null,day.dataset.date)}});
  app.querySelectorAll('[data-survey]').forEach(function(btn){btn.onclick=function(event){event.stopPropagation();editSurvey(btn.dataset.survey)}});
}

function modal(content,extraClass){
  const back=document.createElement('div');back.className='modal-backdrop';back.innerHTML='<section class="modal '+(extraClass||'')+'">'+content+'</section>';document.body.appendChild(back);
  back.onclick=function(event){if(event.target===back)back.remove()};const close=back.querySelector('[data-close]');if(close)close.onclick=function(){back.remove()};return back;
}
function editSurvey(surveyId,date){
  const existing=db.surveys.find(function(s){return s.id===surveyId});
  const survey=existing||{id:id('asg'),title:'',date:date||iso(new Date()),deadline:date||iso(new Date()),url:'',sheet:'',cohort:'AI리더 3기'};
  const people=targets(survey.cohort),done=db.submissions.filter(function(x){return x.surveyId===survey.id}).length;
  const status=existing?'<div class="status-summary"><div class="mini-stat"><span>대상</span><strong>'+people.length+'</strong></div><div class="mini-stat"><span>제출</span><strong>'+done+'</strong></div><div class="mini-stat"><span>미제출</span><strong>'+Math.max(0,people.length-done)+'</strong></div></div><button type="button" class="status-open-btn" data-open-status>제출 현황 보기 <span>→</span></button>':'';
  const back=modal('<div class="modal-head"><h2>'+(existing?'설문 상세 및 수정':'새 설문 등록')+'</h2><button class="close-btn" data-close>×</button></div><form id="survey-form"><div class="modal-body"><div class="form-grid"><div class="field full"><label>설문 제목</label><input name="title" required value="'+esc(survey.title)+'" placeholder="예: 3주차 학습 만족도 조사"></div><div class="field full"><label>Typeform 링크</label><input name="url" required value="'+esc(survey.url)+'" placeholder="https://form.typeform.com/to/..."><p class="help">수강생에게는 설문 링크만 표시됩니다.</p></div><div class="field"><label>캘린더 날짜</label><input name="date" type="date" required value="'+survey.date+'"></div><div class="field"><label>제출 마감일</label><input name="deadline" type="date" required value="'+survey.deadline+'"></div><div class="field"><label>대상 기수</label><select name="cohort" required>'+cohortOptions(survey.cohort)+'</select></div><div class="field"><label>응답 Google Sheet</label><input name="sheet" value="'+esc(survey.sheet)+'" placeholder="운영진만 볼 수 있어요"></div><div class="field full"><label>과제 구분 키</label><div class="assignment-key">assignment_id = '+survey.id+'</div><p class="help">같은 시트를 여러 주차에 사용해도 이 값으로 제출을 구분합니다.</p></div></div>'+(existing?'<hr style="border:0;border-top:1px solid #eee;margin:5px 0 20px"><h3 style="font-size:13px">제출 현황</h3>'+status:'')+'<p id="survey-error" class="login-error"></p></div><div class="modal-footer">'+(existing?'<button type="button" class="danger-btn" data-delete>설문 삭제</button>':'')+'<button type="button" class="secondary-btn" data-cancel>취소</button><button class="primary-btn">저장하기</button></div></form>');
  const urlInput=back.querySelector('input[name="url"]'),urlField=urlInput.closest('.field'),urlHelp=urlField.querySelector('.help');
  urlField.querySelector('label').textContent='Typeform 수정용 링크';
  urlInput.placeholder='https://admin.typeform.com/form/MSdAIuas/create';
  function updateStudentLinkPreview(){const formId=typeformId(urlInput.value);urlHelp.textContent=formId?'수강생용 자동 변환: https://form.typeform.com/to/'+formId+'#pid=학생ID':'수정용 링크를 입력하면 수강생용 링크로 자동 변환됩니다.'}
  urlInput.addEventListener('input',updateStudentLinkPreview);updateStudentLinkPreview();
  const statusButton=back.querySelector('[data-open-status]');if(statusButton)statusButton.onclick=function(){openSubmissionStatus(survey.id)};
  back.querySelector('[data-cancel]').onclick=function(){back.remove()};
  const del=back.querySelector('[data-delete]');if(del)del.onclick=function(){db.surveys=db.surveys.filter(function(s){return s.id!==survey.id});db.submissions=db.submissions.filter(function(x){return x.surveyId!==survey.id});save();back.remove();say('설문을 삭제했습니다.');renderAdmin()};
  back.querySelector('#survey-form').onsubmit=function(event){
    event.preventDefault();const data=new FormData(event.currentTarget);
    if(!validForm(data.get('url'))){back.querySelector('#survey-error').textContent='올바른 Typeform 링크를 입력해 주세요.';return}
    const updated={id:survey.id,title:data.get('title').trim(),url:data.get('url').trim(),date:data.get('date'),deadline:data.get('deadline'),cohort:normalizeCohort(data.get('cohort')),sheet:data.get('sheet').trim()};
    if(existing)Object.assign(existing,updated);else db.surveys.push(updated);save();back.remove();say(existing?'설문 정보를 수정했습니다.':'새 설문을 등록했습니다.');renderAdmin();
  };
}
function openSubmissionStatus(surveyId){
  const survey=db.surveys.find(function(item){return item.id===surveyId}),people=targets(survey.cohort),records=db.submissions.filter(function(item){return item.surveyId===survey.id}),done=records.length;
  const rows=people.map(function(student){const record=records.find(function(item){return item.studentId===student.id}),yes=Boolean(record);return'<tr data-submit-state="'+(yes?'submitted':'missing')+'" data-student-search="'+esc((student.name+' '+student.cohort).toLowerCase())+'"><td><div class="status-name"><span class="avatar">'+esc(student.name.slice(-1))+'</span><strong>'+esc(student.name)+'</strong></div></td><td>'+esc(student.cohort)+'</td><td><span class="status-badge '+(yes?'submitted':'missing')+'">'+(yes?'제출 완료':'미제출')+'</span></td><td>'+(yes&&record.submittedAt?esc(record.submittedAt):'—')+'</td></tr>'}).join('');
  const back=modal('<div class="modal-head"><div><h2>제출 현황</h2><p class="modal-subtitle">'+esc(survey.title)+'</p></div><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="status-summary large"><div class="mini-stat"><span>전체 대상</span><strong>'+people.length+'<small>명</small></strong></div><div class="mini-stat submitted"><span>제출 완료</span><strong>'+done+'<small>명</small></strong></div><div class="mini-stat missing"><span>미제출</span><strong>'+Math.max(0,people.length-done)+'<small>명</small></strong></div></div><div class="status-toolbar"><div class="status-filters"><button class="active" data-status-filter="all">전체</button><button data-status-filter="submitted">제출</button><button data-status-filter="missing">미제출</button></div><input class="search" data-status-search placeholder="이름 검색"></div><div class="submission-table-wrap"><table class="submission-table"><thead><tr><th>이름</th><th>기수</th><th>상태</th><th>제출일</th></tr></thead><tbody>'+rows+'</tbody></table><div class="status-empty" hidden>조건에 맞는 수강생이 없습니다.</div></div></div><div class="modal-footer"><button type="button" class="primary-btn" data-status-close>확인</button></div>','submission-status-modal');
  let activeFilter='all',searchWord='';
  function applyStatusFilter(){let visible=0;back.querySelectorAll('.submission-table tbody tr').forEach(function(row){const matchesFilter=activeFilter==='all'||row.dataset.submitState===activeFilter,matchesSearch=row.dataset.studentSearch.includes(searchWord);row.hidden=!(matchesFilter&&matchesSearch);if(!row.hidden)visible++});back.querySelector('.status-empty').hidden=visible>0}
  back.querySelectorAll('[data-status-filter]').forEach(function(button){button.onclick=function(){activeFilter=button.dataset.statusFilter;back.querySelectorAll('[data-status-filter]').forEach(function(item){item.classList.toggle('active',item===button)});applyStatusFilter()}});
  back.querySelector('[data-status-search]').oninput=function(event){searchWord=event.target.value.trim().toLowerCase();applyStatusFilter()};
  back.querySelector('[data-status-close]').onclick=function(){back.remove()};
}

function renderStudents(){
  const rows=db.students.map(function(s){return'<tr><td><span class="cohort-pill">'+esc(s.cohort)+'</span></td><td><strong>'+esc(s.name)+'</strong></td><td>••••</td><td>'+db.submissions.filter(function(x){return x.studentId===s.id}).length+'건</td><td><button class="table-action" data-edit="'+s.id+'">정보 수정</button></td></tr>'}).join('');
  app.innerHTML=adminShell('<section class="panel student-panel"><div class="student-tools"><h2>전체 수강생 <small style="color:#8f94a3;font-weight:400">'+db.students.length+'명</small></h2><input class="search" id="search" placeholder="이름 또는 기수 검색"></div><div class="table-scroll"><table><thead><tr><th>기수</th><th>이름 / 로그인 ID</th><th>비밀번호</th><th>제출</th><th>관리</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>','수강생 관리','기수·이름·비밀번호로 수강생 계정을 관리하세요.');
  bindAdmin();app.querySelector('[data-bulk]').onclick=bulkStudents;
  app.querySelector('#search').oninput=function(event){const word=event.target.value.toLowerCase();app.querySelectorAll('tbody tr').forEach(function(row){row.hidden=!row.textContent.toLowerCase().includes(word)})};
  app.querySelectorAll('[data-edit]').forEach(function(btn){btn.onclick=function(){editStudent(btn.dataset.edit)}});
}
function bulkStudents(){
  const back=modal('<div class="modal-head"><h2>수강생 등록</h2><button class="close-btn" data-close>×</button></div><div class="registration-tabs"><button class="active" data-register-tab="single">개별 등록</button><button data-register-tab="csv">CSV 일괄 등록</button></div><form id="single-form"><div class="modal-body"><div class="field"><label>기수</label><select name="cohort" required>'+cohortOptions('AI리더 3기')+'</select></div><div class="field"><label>이름</label><input name="name" required placeholder="수강생 이름"></div><div class="field"><label>비밀번호</label><input name="password" required placeholder="전화번호 뒤 4자리" maxlength="20"></div><p id="single-error" class="login-error"></p></div><div class="modal-footer"><button type="button" class="secondary-btn" data-cancel>취소</button><button class="primary-btn">수강생 등록</button></div></form><form id="csv-form" hidden><div class="modal-body"><label class="csv-upload"><input name="file" type="file" accept=".csv,text/csv"><span class="upload-icon">⇧</span><strong>CSV 파일을 선택하세요</strong><small>기수, 이름, 비밀번호 순서의 CSV 파일</small></label><div class="csv-example"><b>CSV 예시</b><code>기수,이름,비밀번호<br>AI리더 3기,홍길동,1234<br>AI리더 3기,김하늘,5678</code></div><p id="csv-error" class="login-error"></p></div><div class="modal-footer"><button type="button" class="secondary-btn" data-cancel>취소</button><button class="primary-btn">CSV 업로드</button></div></form>');
  back.querySelectorAll('[data-cancel]').forEach(function(button){button.onclick=function(){back.remove()}});
  back.querySelectorAll('[data-register-tab]').forEach(function(button){button.onclick=function(){back.querySelectorAll('[data-register-tab]').forEach(function(tab){tab.classList.toggle('active',tab===button)});back.querySelector('#single-form').hidden=button.dataset.registerTab!=='single';back.querySelector('#csv-form').hidden=button.dataset.registerTab!=='csv'}});
  back.querySelector('#csv-form input[type="file"]').onchange=function(event){const file=event.target.files[0];if(file){back.querySelector('.csv-upload strong').textContent=file.name;back.querySelector('.csv-upload small').textContent='업로드 준비 완료'}};
  back.querySelector('#single-form').onsubmit=function(event){event.preventDefault();const data=new FormData(event.currentTarget),cohort=normalizeCohort(data.get('cohort')),name=data.get('name').trim(),password=data.get('password').trim();const found=db.students.find(function(student){return student.cohort===cohort&&student.name===name});if(found){back.querySelector('#single-error').textContent='같은 기수에 이미 등록된 이름입니다.';return}db.students.push({id:id('stu'),cohort:cohort,name:name,password:password});save();back.remove();say(name+' 수강생을 등록했습니다.');renderStudents()};
  back.querySelector('#csv-form').onsubmit=async function(event){event.preventDefault();const file=event.currentTarget.elements.file.files[0];if(!file){back.querySelector('#csv-error').textContent='업로드할 CSV 파일을 선택해 주세요.';return}try{const rows=parseCsv(await file.text());const parsed=rows.filter(function(row,index){if(index===0&&/기수|cohort/i.test(row[0]||''))return false;return row.length>=3&&row[0]&&row[1]&&row[2]});if(!parsed.length)throw new Error('empty');parsed.forEach(function(row){const cohort=normalizeCohort(row[0]),name=row[1].trim(),password=row[2].trim(),found=db.students.find(function(student){return student.cohort===cohort&&student.name===name});if(found)found.password=password;else db.students.push({id:id('stu'),cohort:cohort,name:name,password:password})});save();back.remove();say(parsed.length+'명을 CSV로 등록했습니다.');renderStudents()}catch(error){back.querySelector('#csv-error').textContent='CSV 형식을 확인해 주세요. (기수, 이름, 비밀번호)'}};
}
function parseCsv(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let index=0;index<text.length;index++){const char=text[index],next=text[index+1];if(char==='"'&&quoted&&next==='"'){value+='"';index++}else if(char==='"'){quoted=!quoted}else if(char===','&&!quoted){row.push(value.trim());value=''}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')index++;row.push(value.trim());if(row.some(Boolean))rows.push(row);row=[];value=''}else{value+=char}}
  row.push(value.trim());if(row.some(Boolean))rows.push(row);if(rows[0]&&rows[0][0])rows[0][0]=rows[0][0].replace(/^\uFEFF/,'');return rows;
}
function editStudent(studentId){
  const student=db.students.find(function(s){return s.id===studentId});
  const back=modal('<div class="modal-head"><h2>수강생 정보 수정</h2><button class="close-btn" data-close>×</button></div><form id="student-form"><div class="modal-body"><div class="field"><label>기수</label><select name="cohort">'+cohortOptions(student.cohort)+'</select></div><div class="field"><label>이름 / 로그인 ID</label><input name="name" value="'+esc(student.name)+'"></div><div class="field"><label>비밀번호</label><input name="password" value="'+esc(student.password)+'"></div></div><div class="modal-footer"><button type="button" class="danger-btn" data-delete>수강생 삭제</button><button type="button" class="secondary-btn" data-cancel>취소</button><button class="primary-btn">저장하기</button></div></form>');
  back.querySelector('[data-cancel]').onclick=function(){back.remove()};
  back.querySelector('[data-delete]').onclick=function(){db.students=db.students.filter(function(s){return s.id!==studentId});db.submissions=db.submissions.filter(function(x){return x.studentId!==studentId});save();back.remove();say('수강생을 삭제했습니다.');renderStudents()};
  back.querySelector('#student-form').onsubmit=function(event){event.preventDefault();const data=new FormData(event.currentTarget);student.cohort=normalizeCohort(data.get('cohort'));student.name=data.get('name').trim();student.password=data.get('password');save();back.remove();say('수강생 정보를 수정했습니다.');renderStudents()};
}

function renderStudent(){
  const student=db.students.find(function(s){return s.id===session.studentId});if(!student){session=null;renderLogin();return}
  const surveys=db.surveys.filter(function(s){return s.cohort===student.cohort}),done=surveys.filter(function(s){return submitted(s.id,student.id)}).length;
  app.innerHTML='<div class="student-layout"><header class="student-header"><div class="brand"><span class="brand-mark">S</span>SurveyFlow</div><div class="student-user"><div class="info"><strong>'+esc(student.name)+'</strong><small>'+esc(student.cohort)+'</small></div><span class="avatar">'+esc(student.name.slice(-1))+'</span><button class="logout" data-logout style="color:#8a8f9f">로그아웃</button></div></header><main class="workspace"><section class="student-hero"><div><p class="hello">HELLO, '+esc(student.name)+'</p><h1>이번 달 설문 일정을 확인하세요.</h1></div><div class="progress-card"><div class="row"><span>전체 제출 현황</span><strong>'+done+' / '+surveys.length+'</strong></div><div class="progress-bar"><i style="width:'+(surveys.length?done/surveys.length*100:0)+'%"></i></div></div></section><section class="panel calendar-panel"><div class="calendar-head"><div class="month-nav"><button class="icon-btn" data-month="-1">‹</button><h2>'+labelMonth(month)+'</h2><button class="icon-btn" data-month="1">›</button></div><div class="legend"><span><i class="dot"></i>제출 전</span><span><i class="dot done"></i>제출 완료</span><span><i class="dot due"></i>마감 지남</span></div></div>'+calendarHtml(surveys,student)+'</section></main></div>';
  app.querySelector('[data-logout]').onclick=function(){session=null;renderLogin()};
  app.querySelectorAll('[data-month]').forEach(function(btn){btn.onclick=function(){month.setMonth(month.getMonth()+Number(btn.dataset.month));renderStudent()}});
  app.querySelectorAll('[data-survey]').forEach(function(btn){btn.onclick=function(){openSurvey(btn.dataset.survey,student)}});
}
function openSurvey(surveyId,student){
  const survey=db.surveys.find(function(s){return s.id===surveyId}),done=submitted(survey.id,student.id);
  if(done){
    const completed=modal('<div class="completed-survey"><span class="completed-check">✓</span><p class="completed-label">SUBMITTED</p><h2>제출이 완료된 설문입니다.</h2><p class="completed-title">'+esc(survey.title)+'</p><button class="primary-btn" data-confirm>확인</button></div>','completed-modal');
    completed.querySelector('[data-confirm]').onclick=function(){completed.remove()};
    return;
  }
  const url=embedUrl(survey,student),formId=typeformId(survey.url);
  const back=document.createElement('div');back.className='modal-backdrop';back.innerHTML='<section class="modal survey-modal"><aside class="survey-info"><span class="label">SURVEY</span><h2>'+esc(survey.title)+'</h2><p>'+esc(survey.cohort)+' 대상 설문입니다.</p><div class="deadline"><span style="font-size:10px;color:#8d96ac">제출 마감</span><strong>'+koDate(survey.deadline)+'</strong></div><p class="assignment-note">일정 구분 키: '+survey.id+' · 응답 시트 주소는 수강생에게 공개되지 않습니다.</p></aside><div class="survey-frame">'+(formId?'<div class="typeform-target" aria-label="'+esc(survey.title)+'"></div>':'<div class="frame-empty">올바른 Typeform 링크가 등록되지 않았어요.</div>')+'<button class="survey-close" data-close>×</button><button class="demo-complete" data-complete>✓ 제출 상태 테스트</button></div></section>';document.body.appendChild(back);
  back.querySelector('[data-close]').onclick=function(){back.remove()};back.onclick=function(event){if(event.target===back)back.remove()};
  const target=back.querySelector('.typeform-target');
  if(target&&window.tf&&window.tf.createWidget){
    window.tf.createWidget(formId,{container:target,hidden:{pid:student.id,assignment_id:survey.id,student_name:student.name},onSubmit:function(payload){markSubmitted(survey,student,payload&&payload.responseId);back.remove();say('Typeform 제출을 확인했습니다.');renderStudent()}});
  }else if(target&&url){
    target.innerHTML='<iframe title="'+esc(survey.title)+'" src="'+esc(url)+'" allow="camera; microphone; autoplay; encrypted-media"></iframe>';
  }
  const complete=back.querySelector('[data-complete]');if(complete)complete.onclick=function(){markSubmitted(survey,student,'demo');back.remove();say('제출 완료로 표시했습니다.');renderStudent()};
}
renderLogin();
