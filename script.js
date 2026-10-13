const ROLES = {
  aluno:'Aluno',
  professor:'Professor',
  coordenador:'Coordenador',
  diretor:'Diretor',
  cantina:'Cantina'
};

const isAdmin = r => r==='diretor'||r==='coordenador';

const AULAS = [
  ["07:20","08:15"],
  ["08:15","09:10"],
  ["09:30","10:25"],
  ["10:25","11:20"],
  ["13:00","13:55"],
  ["13:55","14:50"],
  ["15:10","16:05"],
  ["16:05","17:00"]
];

const PAUSAS = {
  1:"Intervalo 09:10 – 09:30",
  3:"Almoço 11:20 – 13:00",
  5:"Intervalo 14:50 – 15:10"
};

const DIAS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta'
];

const MAX_POR_DIA=2;

const $=s=>document.querySelector(s);

const hash = s => {
  let h=5381;
  for(const c of s)h=(h*33)^c.charCodeAt(0);
  return String(h>>>0)
};

const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const hojeStr = () => new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);

const fmt = d => d.split('-').reverse().join('/');

let db=JSON.parse(localStorage.getItem('escola')||'null');

function save(){
  localStorage.setItem('escola',JSON.stringify(db))
}

if(!db){
  const u=(nome,email,role)=>({nome,email,h:hash('123456'),role});
  db={
    users:[
      u('Diretor','diretor@escola.com','diretor'),u('Coordenador','coordenador@escola.com','coordenador'),
      u('Cantina','cantina@escola.com','cantina'),u('Professor','professor@escola.com','professor'),u('Aluno','aluno@escola.com','aluno')
    ],
    menu:[
      '','','','',''
    ],
    provas:[],
    lab:[]
  };
  save();
}

let me = sessionStorage.getItem('me')
let tab = 'menu'
let labDate=hojeStr()
let cal=new Date();

const user = () => db.users.find(u => u.email===me);

function login(){
  const e=$('#le').value.trim().toLowerCase(),s=$('#ls').value;
  const u=db.users.find(x=>x.email===e&&x.h===hash(s));
  if(!u)return alert('Email ou senha incorretos');
  me=e;
  sessionStorage.setItem('me',e);
  tab='menu';
  render();
}

function logout(){
  me=null;
  sessionStorage.removeItem('me');
  render()
}

function go(t){
  tab=t;
  render()
}

function tabs(u){
  const t=[
    ['menu','Cardápio'],
    ['provas','Provas']
  ];
  if(u.role==='professor'||isAdmin(u.role))
    t.push(['lab','Laboratório']);
  if(isAdmin(u.role))
    t.push(['users','Usuários']);
  return t;
}

/* CARDÁPIO */
function viewMenu(u){
  const edit = u.role==='cantina'||isAdmin(u.role);
  return `<h2>Cardápio da semana</h2>
          <div class="grid">`+DIAS.map((d,i)=>`
          <div class="card">
            <b>${d}</b>${edit?`<textarea id="m${i}" rows="4">${esc(db.menu[i])}</textarea>`
    :`<p>${esc(db.menu[i])||'<i>Não informado</i>'}</p>`}</div>`).join('')+`</div>`
    +(edit?`<button onclick="saveMenu()">Salvar cardápio</button>`:'');
}
function saveMenu(){DIAS.forEach((_,i)=>db.menu[i]=$('#m'+i).value);save();alert('Cardápio salvo!')}

/* PROVAS */
function viewProvas(u){
  const y=cal.getFullYear(),m=cal.getMonth(),first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();
  const nome=cal.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  let cells=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div class="h">${d}</div>`).join('')+'<div style="background:none"></div>'.repeat(first);
  for(let d=1;d<=n;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells+=`<div class="${ds===hojeStr()?'hoje':''}">${d}`+db.provas.filter(p=>p.data===ds).map(p=>`<div class="ev">${esc(p.disc)} (${esc(p.turma)})</div>`).join('')+`</div>`;
  }
  const prox=db.provas.filter(p=>p.data>=hojeStr()).sort((a,b)=>a.data.localeCompare(b.data));
  const admin=isAdmin(u.role);
  return `<h2>Calendário de provas</h2><div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <button onclick="mes(-1)">◀</button><b style="text-transform:capitalize">${nome}</b><button onclick="mes(1)">▶</button></div>
    <div class="cal">${cells}</div></div>
    ${admin?`<div class="card"><b>Cadastrar prova</b>
      <input type="date" id="pd"><input id="pdi" placeholder="Disciplina"><input id="pt" placeholder="Turma (ex: 9º A)">
      <input id="pds" placeholder="Conteúdo / observação"><button onclick="addProva()">Adicionar</button></div>`:''}
    <div class="card"><b>Próximas provas</b>${prox.map(p=>`<div class="slot"><span><b>${fmt(p.data)}</b> — ${esc(p.disc)} · ${esc(p.turma)}<br><small>${esc(p.desc||'')}</small></span>
      ${admin?`<button class="red" onclick="delProva('${p.id}')">Excluir</button>`:''}</div>`).join('')||'<p>Nenhuma prova agendada.</p>'}</div>`;
}
function mes(x){cal=new Date(cal.getFullYear(),cal.getMonth()+x,1);render()}
function addProva(){
  const p={id:Date.now()+'',data:$('#pd').value,disc:$('#pdi').value.trim(),turma:$('#pt').value.trim(),desc:$('#pds').value.trim()};
  if(!p.data||!p.disc||!p.turma)return alert('Preencha data, disciplina e turma');
  db.provas.push(p);save();render();
}
function delProva(id){db.provas=db.provas.filter(p=>p.id!==id);save();render()}

/* LABORATÓRIO */
function viewLab(u){
  const doDia=db.lab.filter(l=>l.data===labDate);
  const meus=doDia.filter(l=>l.email===u.email).length;
  let h=`<h2>Laboratório de Informática</h2><div class="card"><label>Data</label><input type="date" id="ld" value="${labDate}" min="${hojeStr()}" onchange="labDate=this.value;render()">
  <p>Você agendou <b>${meus}</b> de <b>${MAX_POR_DIA}</b> aulas neste dia.</p>`;
  AULAS.forEach((a,i)=>{
    const b=doDia.find(l=>l.slot===i);
    const dono=b&&db.users.find(x=>x.email===b.email);
    h+=`<div class="slot"><span><b>${i+1}ª aula</b> · ${a[0]} – ${a[1]}</span>`+
      (b?`<span class="ocup">Ocupado: ${esc(dono?dono.nome:b.email)}</span>${(b.email===u.email||isAdmin(u.role))?`<button class="red" onclick="cancelar(${i})">Cancelar</button>`:''}`
      :`<span class="livre">Livre</span><button onclick="agendar(${i})">Agendar</button>`)+`</div>`;
    if(PAUSAS[i])h+=`<div class="pausa">${PAUSAS[i]}</div>`;
  });
  return h+`</div>`;
}
function agendar(i){
  const u=user();
  if(!labDate||labDate<hojeStr())return alert('Escolha uma data válida');
  const dow=new Date(labDate+'T12:00').getDay();
  if(dow===0||dow===6)return alert('O laboratório funciona apenas de segunda a sexta');
  if(db.lab.some(l=>l.data===labDate&&l.slot===i))return alert('Horário já ocupado');
  if(db.lab.filter(l=>l.data===labDate&&l.email===u.email).length>=MAX_POR_DIA)return alert('Limite de 2 agendamentos por dia atingido');
  db.lab.push({data:labDate,slot:i,email:u.email});save();render();
}
function cancelar(i){db.lab=db.lab.filter(l=>!(l.data===labDate&&l.slot===i));save();render()}

/* USUÁRIOS (admin) */
function viewUsers(u){
  return `<h2>Usuários</h2><div class="card"><b>Novo usuário</b>
    <input id="un" placeholder="Nome"><input id="ue" type="email" placeholder="Email"><input id="us" type="password" placeholder="Senha">
    <select id="ur">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
    <button onclick="addUser()">Criar</button></div>
    <div class="card">`+db.users.map(x=>`<div class="slot"><span>${esc(x.nome)} · ${esc(x.email)} · <i>${ROLES[x.role]}</i></span>
    ${x.email!==u.email?`<button class="red" onclick="delUser('${esc(x.email)}')">Excluir</button>`:''}</div>`).join('')+`</div>`;
}
function addUser(){
  const x={nome:$('#un').value.trim(),email:$('#ue').value.trim().toLowerCase(),h:hash($('#us').value),role:$('#ur').value};
  if(!x.nome||!x.email||!$('#us').value)return alert('Preencha todos os campos');
  if(db.users.some(y=>y.email===x.email))return alert('Email já cadastrado');
  db.users.push(x);save();render();
}
function delUser(e){if(confirm('Excluir usuário?')){db.users=db.users.filter(x=>x.email!==e);save();render()}}

/* RENDER */
function render(){
  const app=$('#app'),u=user();
  if(!u){
    app.innerHTML=`<div class="card login"><h2>Portal Escolar</h2><input id="le" type="email" placeholder="Email"><input id="ls" type="password" placeholder="Senha" onkeydown="if(event.key==='Enter')login()"><button onclick="login()" style="width:100%">Entrar</button>
    <p style="font-size:12px;color:#64748b">Teste: diretor@escola.com, coordenador@escola.com, cantina@escola.com, professor@escola.com, aluno@escola.com — senha 123456</p></div>`;
    return;
  }
  const t=tabs(u);if(!t.some(x=>x[0]===tab))tab='menu';
  const v={menu:viewMenu,provas:viewProvas,lab:viewLab,users:viewUsers}[tab](u);
  app.innerHTML=`<header><b>🏫 Portal Escolar</b><span>${esc(u.nome)} (${ROLES[u.role]}) <button class="gray" onclick="logout()">Sair</button></span></header>
  <nav>${t.map(x=>`<button class="${x[0]===tab?'on':''}" onclick="go('${x[0]}')">${x[1]}</button>`).join('')}</nav><main>${v}</main>`;
}
render();