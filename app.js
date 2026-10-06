
function _asList(v){
  if(!v) return [];
  if(Array.isArray(v)) return v.filter(x=>String(x||'').trim()).map(x=>String(x).trim());
  const s = String(v).trim();
  if(!s) return [];
  return s.split(/\r?\n|\s*;\s*/).map(x=>x.trim()).filter(Boolean);
}

const $=(id)=>document.getElementById(id);
let data={meta:{customer:"",site:"",space:"",inspectionDate:"",reportOutcome:""},records:[]};
let editIndex = null;
let showUninspectedOnly = false;

let assetTypeOptions = [];
function setupAssetTypeFilter(items){
  assetTypeOptions = (items||[]).filter(Boolean);
  const input = $('assetTypeInput');
  const box = $('assetTypeSuggest');
  if(!input || !box) return;

  const show = () => {
    const q = (input.value||'').toLowerCase().trim();
    let matches = assetTypeOptions;
    if(q){
      matches = assetTypeOptions.filter(x => x.toLowerCase().includes(q));
    }
    matches = matches.slice(0, 40);
    if(!matches.length){
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    box.innerHTML = matches.map(x => `<div class="suggestItem" data-val="${escapeHtml(x)}">${escapeHtml(x)}</div>`).join('');
    box.classList.remove('hidden');
    box.querySelectorAll('.suggestItem').forEach(item => {
      const choose = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        input.value = item.getAttribute('data-val') || '';
        box.classList.add('hidden');
        box.innerHTML = '';
        input.blur();
      };
      item.addEventListener('click', choose);
      item.addEventListener('touchstart', choose, {passive:false});
    });
  };

  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('click', show);
  input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 220));
}

const escapeHtml=(s)=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"','&quot;').replaceAll("'",'&#39;');
const idKey=(v)=>{const m=String(v||"").match(/(\d+)/);return m?parseInt(m[1],10):1e12;};
const selectedMulti=(sel)=>Array.from(sel.selectedOptions).map(o=>o.value);
const metaFields=['customer','site','space','inspectionDate','nextExaminationDate','previousInspectionDate','reportOutcome','inspectorCompany','inspectorComments'];

const assetQuestions=[["assetsPreviouslyRecorded","Have assets previously been recorded?"],["existingAssetsChecked","Have existing assets been checked and photos/information updated?"],["assetsAdded","Any assets added since last visit?"],["assetsRemoved","Any assets removed since last visit?"]];
function showAssetConfirmation(){
  const required=$('assetsPreviouslyRecorded').value==='no';
  $('allAssetsAddedWrap').classList.toggle('hidden',!required);
  if(!required)$('allAssetsAddedConfirmed').checked=false;
}
function populateAssetDetails(){
  for(const [key] of assetQuestions)$(key).value=['yes','no'].includes(data.meta[key])?data.meta[key]:'';
  $('allAssetsAddedConfirmed').checked=data.meta.allAssetsAddedConfirmed===true;
  showAssetConfirmation();
}
function cleanInactiveFindings(r){
  for(const [flag,previous,fields] of [['advisory','prevAdv',['advActions','advNotes','improvements']],['fail','prevFail',['failDefects','failOther','failNotes','defects']],['limitation','prevLim',['limDetails','limNotes','limitations']]]){
    if(r[flag])continue;
    const parts=[r[previous],...fields.flatMap(k=>Array.isArray(r[k])?r[k]:[r[k]])].filter(v=>String(v||'').trim());
    r[previous]=[...new Set(parts)].join('\n');
    for(const key of fields)r[key]=Array.isArray(r[key])?[]:'';
  }
  return r;
}
function findingButtons(r,i){
  return [['adv','advisory','prevAdv','advisory'],['fail','fail','prevFail','fail'],['lim','limitation','prevLim','limitation']].map(([kind,flag,previous,label])=>
    (r[previous] ? '<button type="button" class="tagBtn historyTag" data-info="'+kind+'" data-history="true" data-i="'+i+'">Previous '+label+'</button>' : '')+
    (r[flag] ? '<button type="button" class="tagBtn tagBtn-'+kind+'" data-info="'+kind+'" data-i="'+i+'">Current '+label+'</button>' : '')
  ).join('');
}

function dateISO(value){
  const s=String(value||'').trim(); if(!s)return '';
  let y,m,d, match;
  if(match=s.match(/^(\d{4})-(\d{2})-(\d{2})$/)){[,y,m,d]=match;}
  else if(match=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)){[,d,m,y]=match;}
  else {const months=['january','february','march','april','may','june','july','august','september','october','november','december'];match=s.toLowerCase().match(/^(\d{1,2}) ([a-z]+) (\d{4})$/);if(!match)return '';d=match[1];m=months.indexOf(match[2])+1;y=match[3];}
  const dt=new Date(Date.UTC(+y,+m-1,+d));
  return dt.getUTCFullYear()===+y&&dt.getUTCMonth()===+m-1&&dt.getUTCDate()===+d?dt.toISOString().slice(0,10):'';
}
function nextAnnual(value){const iso=dateISO(value);if(!iso)return '';const [y,m,d]=iso.split('-').map(Number);const day=Math.min(d,new Date(Date.UTC(y+1,m,0)).getUTCDate());return [y+1,String(m).padStart(2,'0'),String(day).padStart(2,'0')].join('-');}
function populateMeta(){
  data.meta={inspectorCompany:'Stage Electrics',...data.meta};
  populateAssetDetails();
  for(const id of metaFields){let value=data.meta[id]||'';if(id.includes('Date') && id!=='inspectionDate')value=dateISO(value);$(id).value=value;}
  $('nextExaminationDate').value=nextAnnual($('inspectionDate').value);
}
function save(){
  $('nextExaminationDate').value=nextAnnual($('inspectionDate').value);
  for(const id of metaFields)data.meta[id]=$(id).value||'';
  for(const [key] of assetQuestions)data.meta[key]=$(key).value;
  data.meta.allAssetsAddedConfirmed=$('assetsPreviouslyRecorded').value==='no' && $('allAssetsAddedConfirmed').checked;
  data.records.forEach(cleanInactiveFindings);
  data.schemaVersion='1.2.34';data.meta.examinationIntervalMonths=12;
  localStorage.setItem('rote_mobile_inspector_v1',JSON.stringify(data));
}
function load(){
  try{const raw=localStorage.getItem('rote_mobile_inspector_v1');if(raw){const parsed=JSON.parse(raw);if(parsed&&Array.isArray(parsed.records))data=parsed;}}catch(e){}
  data.meta=data.meta||{};data.records.forEach(cleanInactiveFindings);populateMeta();render();updateProgress();
}
function fillSelect(sel,items){sel.innerHTML="";for(const it of items){const o=document.createElement("option");o.value=it;o.textContent=it;sel.appendChild(o);}}
function fillDatalist(dl,items){dl.innerHTML="";for(const it of items){const o=document.createElement("option");o.value=it;dl.appendChild(o);}}
function showBlocks(){const adv=$('cAdv').checked, fail=$('cFail').checked, lim=$('cLim').checked;
$('advBlock').classList.toggle('hidden',!adv);$('failBlock').classList.toggle('hidden',!fail);$('limBlock').classList.toggle('hidden',!lim);
$('failChecklistOnly').classList.toggle('hidden',adv);}
function setDesignationValue(value, note){
  const sel=$('assetDesignation');
  const other=$('assetDesignationOther');
  const wrap=$('assetDesignationOtherWrap');
  const v=String(value||'').trim();
  const n=String(note||'').trim();
  if(!sel) return;
  const has=[...sel.options].some(o=>o.value===v);
  if(v && has){
    sel.value=v;
    if(other) other.value=n;
    if(wrap) wrap.classList.toggle('hidden', v !== 'Other');
  }else if(v){
    sel.value='Other';
    if(other) other.value=n || v;
    if(wrap) wrap.classList.remove('hidden');
  }else{
    sel.value='';
    if(other) other.value=n;
    if(wrap) wrap.classList.add('hidden');
  }
}
function clearForm(){['prevAdv','prevFail','prevLim','assetId','assetDesignation','assetDesignationOther','customerAssetId','manufacturerModel','assetPreviousInspectionDate','typeNotes','loadInfo','advNotes','failOther','failNotes','limDetails','limNotes','thisInspection','assetTypeInput'].forEach(id=>{const el=$(id); if(el) el.value='';});
['cPass','cFail','cAdv','cLim','chkGenericPhotos','chkFixingsPhotos','chkObsPhotos','chkRemedial','chkGenericPhotosF','chkFixingsPhotosF','chkObsPhotosF','chkRemedialF','chkLimDetails','chkLimPhotos'].forEach(id=>{const el=$(id); if(el) el.checked=false;});
if($('advActions')) $('advActions').selectedIndex=-1;if($('failDefects')) $('failDefects').selectedIndex=-1;if($('failOtherWrap')) $('failOtherWrap').classList.add('hidden');if($('assetTypeInput')) $('assetTypeInput').value='';if($('assetTypeSuggest')) $('assetTypeSuggest').classList.add('hidden');
showBlocks();$('addMsg').textContent="";}
function sortAssets(){const editing=editIndex===null?null:data.records[editIndex];data.records.sort((a,b)=>idKey(a.assetId)-idKey(b.assetId));if(editing)editIndex=data.records.indexOf(editing);}
function renumber(){data.records.forEach((r,i)=>r.assetNo=i+1);}
function badge(t){
  const cls = String(t||'').toLowerCase();
  return `<span class="badge badge-${cls}">${t}</span>`;
}

function showInfo(kind, text, history){
  const modal = $('infoModal');
  if(!modal) return;
  const titleEl = $('infoModalTitle');
  const bodyEl = $('infoModalBody');
  const prefix=history?'Previous ':'Current ';
  const titles = {adv:prefix+'advisory', fail:prefix+'fail', lim:prefix+'limitation'};
  if(titleEl) titleEl.textContent = titles[kind] || 'Details';
  if(bodyEl) bodyEl.textContent = text || '';
  modal.classList.remove('hidden');
}
function hideInfo(){
  const modal = $('infoModal');
  if(modal) modal.classList.add('hidden');
}

function updateProgress(){
  const total = data.records.length;
  const done = data.records.filter(r=>r && r.inspected).length;
  const el = $('progress');
  if(el) el.textContent = total ? `Inspected ${done} / ${total}` : '';
}

function render(){const host=$('assetList');host.innerHTML="";
const q=(($('assetSearch')&&$('assetSearch').value)||'').toLowerCase().trim();
let visibleCount=0;
data.records.forEach((r,i)=>{
const hay=[
  r.assetNo,
  r.origAssetNo,
  r.assetId,
  r.customerAssetId,
  r.assetDesignation,
  r.assetDesignationOther,
  r.assetType
].map(x=>String(x||'').toLowerCase()).join(' ');
if(q && !hay.includes(q)) return;
if(showUninspectedOnly && r.inspected) return;
visibleCount++;
const div=document.createElement('div');div.className='assetItem';div.setAttribute('data-asset-id', r.assetId || '');
const conds=[];if(r.pass)conds.push('Pass');if(r.advisory)conds.push('Advisory');if(r.limitation)conds.push('Limitation');if(r.fail)conds.push('Fail');
div.innerHTML=`<div class="assetHead"><div><div><strong>Asset ${r.assetNo||i+1}</strong> — ID ${escapeHtml(r.assetId||"")}${r.assetDesignation?(' — '+escapeHtml(r.assetDesignation)+(r.assetDesignationOther?' ('+escapeHtml(r.assetDesignationOther)+')':'')):''}${r.customerAssetId?(' — Customer Asset ID: '+escapeHtml(r.customerAssetId)):''} — ${escapeHtml(r.assetType||"")}</div>${r.manufacturerModel?`<div class="small">Manufacturer &amp; Model: ${escapeHtml(r.manufacturerModel)}</div>`:""}${r.previousInspectionDate?`<div class="small">Previous inspection: ${escapeHtml(r.previousInspectionDate)}</div>`:""}${r.typeNotes?`<div class="small">Notes: ${escapeHtml(r.typeNotes)}</div>`:""}</div>
<div class="badges">${conds.map(badge).join("")}</div></div>
<div class="row" style="margin-top:10px"><label class="small" style="display:flex;align-items:center;gap:8px;margin-right:10px;"><input type="checkbox" data-inspected="${i}" ${r.inspected?"checked":""}> Inspected</label>
        ${findingButtons(r,i)}
        <button class="btn" data-edit="${i}">Edit</button>
        <button class="btn danger" data-del="${i}">Delete</button></div>`;
host.appendChild(div);});
host.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{const i=parseInt(btn.getAttribute('data-del'),10);data.records.splice(i,1);renumber();save();render();}));
host.querySelectorAll('[data-info]').forEach(btn=>{
  const open = (ev)=>{ ev.preventDefault(); ev.stopPropagation();
    const i=parseInt(btn.getAttribute('data-i'),10);
    const kind=btn.getAttribute('data-info');
    const a=data.records[i]; if(!a) return;
    const history=btn.getAttribute('data-history')==='true';
    const fields={adv:['prevAdv','advActions','advNotes'],fail:['prevFail','failDefects','failOther','failNotes'],lim:['prevLim','limDetails','limNotes']}[kind];
    const msg=history?a[fields[0]]:fields.slice(1).flatMap(k=>Array.isArray(a[k])?a[k]:[a[k]]).filter(Boolean).join('\n');
    showInfo(kind, msg || '(no details)', history);
  };
  btn.addEventListener('click', open);
  btn.addEventListener('touchstart', open, {passive:false});
});

  host.querySelectorAll('[data-inspected]').forEach(cb=>cb.addEventListener('change',()=>{
    const i=parseInt(cb.getAttribute('data-inspected'),10);
    if(Number.isNaN(i) || !data.records[i]) return;
    data.records[i].inspected = cb.checked;
    save();
    updateProgress();
    if(showUninspectedOnly) render();
  }));

const sc=$('searchCount');
if(sc){
  const total=data.records.length;
  const filterParts=[];
  if(q) filterParts.push('search');
  if(showUninspectedOnly) filterParts.push('uninspected only');
  sc.textContent = filterParts.length ? `Showing ${visibleCount} of ${total} assets (${filterParts.join(' + ')})` : (total ? `${total} assets loaded` : '');
}

host.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{
  const i=parseInt(btn.getAttribute('data-edit'),10);
  const a=data.records[i]; if(!a) return;
  editIndex = i;
  $('assetId').value = a.assetId||'';
  setDesignationValue(a.assetDesignation||'', a.assetDesignationOther||'');
  if($('customerAssetId')) $('customerAssetId').value = a.customerAssetId||'';
  $('assetTypeInput').value = a.assetType||'Other';
  $('typeNotes').value = a.typeNotes||'';
  $('manufacturerModel').value=a.manufacturerModel||'';
  $('assetPreviousInspectionDate').value=a.previousInspectionDate||'';
  for(const key of ['chkGenericPhotos','chkFixingsPhotos','chkObsPhotos','chkRemedial','chkLimDetails','chkLimPhotos']){if($(key))$(key).checked=!!a[key];if($(key+'F'))$(key+'F').checked=!!a[key];}
  if($('loadInfo')) $('loadInfo').value = a.loadInfo||'';
  $('cPass').checked = !!a.pass;
  $('cFail').checked = !!a.fail;
  $('cAdv').checked = !!a.advisory;
  $('cLim').checked = !!a.limitation;
  // restore multiselects
  if($('advActions')) Array.from($('advActions').options).forEach(o=>o.selected = (a.advActions||[]).includes(o.value));
  if($('advNotes')) $('advNotes').value = a.advNotes||'';
  if($('prevAdv')) $('prevAdv').value = a.prevAdv || '';
  if($('failDefects')) Array.from($('failDefects').options).forEach(o=>o.selected = (a.failDefects||[]).includes(o.value));
  if($('failOther')) $('failOther').value = a.failOther||'';
  if($('failNotes')) $('failNotes').value = a.failNotes||'';
  if($('prevFail')) $('prevFail').value = a.prevFail || '';
  if($('limDetails')) $('limDetails').value = a.limDetails || a.limitationDetails || '';
  if($('limNotes')) $('limNotes').value = a.limNotes||'';
  if($('prevLim')) $('prevLim').value = a.prevLim || '';
  if($('thisInspection')) $('thisInspection').value = a.thisInspection||'';
  $('btnAddAsset').textContent = 'Update asset';
  $('btnCancelEdit').style.display = '';
  showBlocks();
  const addCard=$('addAssetCard'); if(addCard) addCard.scrollIntoView({behavior:'smooth',block:'start'});
}));}
function buildCopy(){sortAssets();renumber();save();
const m=data.meta, lines=[];
lines.push(`Site: ${m.site||""}`.trim());lines.push(`Space: ${m.space||""}`.trim());if(m.customer)lines.push(`Customer: ${m.customer}`.trim());
if(m.inspectionDate)lines.push(`Date of inspection: ${m.inspectionDate}`.trim());
if(m.nextExaminationDate)lines.push('Next thorough examination: '+m.nextExaminationDate);
if(m.previousInspectionDate)lines.push('Previous inspection date: '+m.previousInspectionDate);
if(m.inspectorCompany)lines.push('Inspector company: '+m.inspectorCompany);
if(m.inspectorComments)lines.push('Inspector comments: '+m.inspectorComments);
if(m.reportOutcome)lines.push(`Report outcome: ${m.reportOutcome}`.trim());lines.push("");
for(const [key,label] of assetQuestions)lines.push(label+' '+(m[key]==='yes'?'Yes':m[key]==='no'?'No':'Not answered'));
if(m.assetsPreviouslyRecorded==='no')lines.push('All assets have been added to the Assets function: '+(m.allAssetsAddedConfirmed?'Confirmed':'Not confirmed'));
lines.push('');
for(const r of data.records){
lines.push(`Asset ${r.assetNo} — ID ${r.assetId}${r.assetDesignation?(' — '+r.assetDesignation):''}${r.assetDesignationOther?(' ('+r.assetDesignationOther+')'):''}${r.customerAssetId?(' — Customer Asset ID: '+r.customerAssetId):''} — ${r.assetType}`.trim());
const c=[];if(r.pass)c.push("Pass");if(r.advisory)c.push("Advisory");if(r.limitation)c.push("Limitation");if(r.fail)c.push("Fail");
lines.push(`Condition: ${c.join(" + ")}`.trim());
if(r.manufacturerModel)lines.push('Manufacturer & Model: '+r.manufacturerModel);
if(r.previousInspectionDate||m.previousInspectionDate)lines.push('Previous inspection date: '+(r.previousInspectionDate||m.previousInspectionDate));
lines.push('Inspected tick: '+(r.inspected?'Yes — outcome recorded':'No — not yet confirmed'));
if(r.typeNotes)lines.push(`Notes: ${r.typeNotes}`);
if(r.loadInfo)lines.push(`Loads: ${r.loadInfo}`);
if(r.limitation){if(r.limDetails)lines.push(`Details of limitation: ${r.limDetails}`);
if(r.limNotes)lines.push(`Limitation notes: ${r.limNotes}`);
lines.push("Limitation checklist:");lines.push(`[${r.chkLimDetails?'x':' '}] Details of the limitation.`);lines.push(`[${r.chkLimPhotos?'x':' '}] Photos of limitation.`);}
if(r.advisory){if((r.advActions||[]).length)lines.push("Recommended improvements: "+r.advActions.join("; "));
if(r.advNotes)lines.push("Advisory notes: "+r.advNotes);
lines.push("Advisory / Fail checklist:");
lines.push(`[${r.chkGenericPhotos?'x':' '}] Generic Photos of Structure/Equipment/System - One showing the whole asset and one showing the location of the barcode label.`);
lines.push(`[${r.chkFixingsPhotos?'x':' '}] Photos of primary fixings, suspension and connection methods.`);
lines.push(`[${r.chkObsPhotos?'x':' '}] Photos relating to failure/improvement observations.`);
lines.push(`[${r.chkRemedial?'x':' '}] Please indicate details of remedial actions required (types/quantities of materials etc).`);}
if(r.fail){if((r.failDefects||[]).length)lines.push("Fail defects: "+r.failDefects.join("; "));
if(r.failOther)lines.push("Fail other: "+r.failOther);
if(r.failNotes)lines.push("Fail notes: "+r.failNotes);
if(!r.advisory){lines.push("Advisory / Fail checklist:");
lines.push(`[${r.chkGenericPhotos?'x':' '}] Generic Photos of Structure/Equipment/System - One showing the whole asset and one showing the location of the barcode label.`);
lines.push(`[${r.chkFixingsPhotos?'x':' '}] Photos of primary fixings, suspension and connection methods.`);
lines.push(`[${r.chkObsPhotos?'x':' '}] Photos relating to failure/improvement observations.`);
lines.push(`[${r.chkRemedial?'x':' '}] Please indicate details of remedial actions required (types/quantities of materials etc).`);}}
if(r.thisInspection)lines.push("This inspection: "+r.thisInspection);
lines.push("");}
$('copyText').value=lines.join("\n");}
function exportIssues(){
 const issues=[];
 for(const [key,label] of assetQuestions)if(!['yes','no'].includes(data.meta[key]))issues.push('Asset details: '+label+' — choose Yes or No.');
 if(data.meta.assetsPreviouslyRecorded==='no' && data.meta.allAssetsAddedConfirmed!==true)issues.push('Confirm all assets have been added to the Assets function.');
 if(data.meta.existingAssetsChecked==='no')issues.push('Existing asset records/photos have not been confirmed as checked.');
 for(const [key,label] of [['customer','Customer'],['site','Site'],['space','Space'],['inspectionDate','Inspection date'],['reportOutcome','Report outcome']])if(!data.meta[key])issues.push(label+' is missing.');
 if(!data.records.length)issues.push('No assets recorded.');
 if(editIndex!==null)issues.push('An asset is being edited. Update the asset to include those changes.');
 data.records.forEach((r,i)=>{const label='Asset '+(r.assetNo||i+1)+' ('+(r.assetId||'no ID')+')';if(!r.inspected)issues.push(label+' is not ticked.');if(!r.assetId||!r.assetType)issues.push(label+' needs its ID and type.');if(!r.pass&&!r.fail&&!r.advisory&&!r.limitation&&!r.thisInspection)issues.push(label+' has no outcome or explanatory note.');if(r.pass&&r.fail)issues.push(label+' has both Pass and Fail selected.');for(const [flag,details] of [['advisory',[...(r.advActions||[]),r.advNotes]],['fail',[...(r.failDefects||[]),r.failOther,r.failNotes]],['limitation',[r.limDetails,r.limNotes]]])if(r[flag]&&!details.some(v=>String(v||'').trim()))issues.push(label+' needs '+flag+' details.');});
 const out=data.meta.reportOutcome||'';
 if(data.records.some(r=>r.fail)&&!out.startsWith('Some Assets Failed'))issues.push('Report outcome does not match the failed assets.');
 if(!data.records.some(r=>r.fail)&&data.records.some(r=>r.advisory)&&out==='All Assets Passed.')issues.push('Report outcome does not mention the advisories.');
 return issues;
}
function exportJSON(){save();const issues=exportIssues();if(issues.length){$('exportIssues').replaceChildren(...issues.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));$('exportReview').classList.remove('hidden');$('exportReview').scrollIntoView({behavior:'smooth'});return;}downloadJSON();}
function downloadJSON(){save();const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);
a.download=`${(data.meta.site||"inspection").replaceAll(" ","_")}-inspection.json`;a.click();URL.revokeObjectURL(a.href);}
function importJSON(file){
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const obj=JSON.parse(rd.result);
      if(obj && Array.isArray(obj.records)){
        const om=obj.meta||{};
        data.meta={...om,customer:om.customer||om.Customer||'',site:om.site||om.site_and_space||om.siteAndSpace||'',space:om.space||'',inspectionDate:om.inspectionDate||om.date||om.reportDate||'',reportOutcome:om.reportOutcome||om.report_outcome||om.outcome||'',inspectorCompany:om.inspectorCompany||'Stage Electrics'};
        if(data.meta.reportOutcome&&!data.meta.reportOutcome.endsWith('.'))data.meta.reportOutcome+='.';
        populateMeta();
        // ensure per-record fields exist
        data.records = (obj.records||[]).map(r=>{
          const rr = {inspected:false,
      prevAdv:'',prevFail:'',prevLim:'', ...r};
          rr.prevAdv = rr.prevAdv || rr.advDetails || rr.advisoryDetails || ''; 
          rr.prevFail = rr.prevFail || rr.failDetails || rr.defectDetails || ''; 
          rr.assetDesignationOther = rr.assetDesignationOther || '';
          rr.customerAssetId = rr.customerAssetId || '';
          rr.limDetails = rr.limDetails || rr.limitationDetails || '';
          rr.prevLim = rr.prevLim || ''; 
          return cleanInactiveFindings(rr);
        });
        editIndex=null;clearForm();$('btnAddAsset').textContent='Add asset';$('exportReview').classList.add('hidden');
        save();
        if($('btnCancelEdit')) $('btnCancelEdit').style.display='none';
        sortAssets(); renumber(); render(); updateProgress();
      }
      else {throw new Error("Missing asset records");}
    }catch(e){alert("Could not import this JSON. Please check the file.");}
  };
  rd.readAsText(file);
}


function exportWord(){
  buildCopy();
  const m=data.meta;
  const title = `${m.site||'inspection'} — ${m.space||''}`.trim();
  const bodyLines = $('copyText').value.split("\n").map(l=>{
    if(l === ""){ return `<div style="height:12px"></div>`; }
    return `<div style="white-space:pre-wrap;font-size:11pt;line-height:1.35;">${escapeHtml(l)}</div>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
  <body style="font-family:Calibri,Arial;padding:18px">
    <div style="font-size:16pt;font-weight:700;margin-bottom:10px">${escapeHtml(title)}</div>
    ${bodyLines}
  </body></html>`;
  const blob = new Blob([html], {type: "application/msword"});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  const fname = `${(m.site||'inspection').replaceAll(' ','_')}-${(m.space||'').replaceAll(' ','_')}-completed.doc`.replaceAll('__','_');
  a.download=fname;
  a.click();
  URL.revokeObjectURL(a.href);
}

function printable(){buildCopy();const w=window.open("","_blank");
const m=data.meta;const lines=$('copyText').value.split("\n").map(l=>`<div class="ln">${escapeHtml(l)}</div>`).join("");
w.document.write(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Completed inspection</title>
<style>body{font-family:Arial;padding:16px}.title{font-size:18px;font-weight:800;margin-bottom:6px}.meta{margin-bottom:12px}.ln{white-space:pre-wrap;font-size:12.5px;line-height:1.35}@media print{body{padding:0}}</style>
</head><body><div class="title">${escapeHtml(m.site||"")} — ${escapeHtml(m.space||"")}</div>
<div class="meta">Site: ${escapeHtml(m.site||"")}<br/>Space: ${escapeHtml(m.space||"")}${m.inspectionDate?("<br/>Report: "+escapeHtml(m.inspectionDate)):""}</div>${lines}
<script>window.focus();</script></body></html>`);w.document.close();}
async function init(){
const cfg=await fetch('./data.json?v=34', {cache:'no-store'}).then(r=>r.json());
setupAssetTypeFilter(cfg.assetTypes||[]);fillSelect($('advActions'),cfg.advisoryActions);fillSelect($('failDefects'),cfg.failDefects);
['cAdv','cFail','cLim'].forEach(id=>$(id).addEventListener('change',showBlocks));
if($('assetDesignation')) $('assetDesignation').addEventListener('change',()=>{
  const wrap=$('assetDesignationOtherWrap');
  if(wrap) wrap.classList.toggle('hidden', $('assetDesignation').value !== 'Other');
});
$('failDefects').addEventListener('change',()=>{const opts=selectedMulti($('failDefects')).map(s=>s.toLowerCase());
$('failOtherWrap').classList.toggle('hidden',!opts.some(s=>s.startsWith('other')));});

if($('assetSearch')) $('assetSearch').addEventListener('input',()=>render());
if($('btnClearSearch')) $('btnClearSearch').addEventListener('click',()=>{
  if($('assetSearch')) $('assetSearch').value='';
  render();
});

if($('btnShowUninspected')) $('btnShowUninspected').addEventListener('click',()=>{
  showUninspectedOnly = !showUninspectedOnly;
  $('btnShowUninspected').textContent = showUninspectedOnly ? 'Showing uninspected only' : 'Show uninspected only';
  $('btnShowUninspected').classList.toggle('active', showUninspectedOnly);
  render();
});



$('btnAddAsset').addEventListener('click',()=>{
  const assetId = ($('assetId').value||'').trim();
  if(!assetId){
    $('addMsg').textContent = 'Asset ID is required.';
    return;
  }
  const r = {
    assetNo: 0, // set by renumber after sort
    assetId: assetId,
    inspected: false,
    assetDesignation: ($('assetDesignation').value||'').trim(),
    assetDesignationOther: ($('assetDesignationOther').value||'').trim(),
    customerAssetId: ($('customerAssetId').value||'').trim(),
    assetType: ($('assetTypeInput').value||'Other'),
    manufacturerModel: $('manufacturerModel').value.trim(),
    previousInspectionDate: $('assetPreviousInspectionDate').value,
    typeNotes: ($('typeNotes').value||'').trim(),
    loadInfo: ($('loadInfo').value||'').trim(),
    pass: $('cPass').checked,
    fail: $('cFail').checked,
    advisory: $('cAdv').checked,
    limitation: $('cLim').checked,
    advActions: selectedMulti($('advActions')),
    advNotes: ($('advNotes').value||'').trim(),
    failDefects: selectedMulti($('failDefects')),
    failOther: ($('failOther').value||'').trim(),
    failNotes: ($('failNotes').value||'').trim(),
    limDetails: ($('limDetails').value||'').trim(),
    limNotes: ($('limNotes').value||'').trim(),
    thisInspection: ($('thisInspection').value||'').trim(),
    // checklists (stored but may be excluded from export in this branch if your v1_2 config does)
    chkGenericPhotos: $('cAdv').checked ? $('chkGenericPhotos').checked : $('chkGenericPhotosF').checked,
    chkFixingsPhotos: $('cAdv').checked ? $('chkFixingsPhotos').checked : $('chkFixingsPhotosF').checked,
    chkObsPhotos: $('cAdv').checked ? $('chkObsPhotos').checked : $('chkObsPhotosF').checked,
    chkRemedial: $('cAdv').checked ? $('chkRemedial').checked : $('chkRemedialF').checked,
    chkLimDetails: $('chkLimDetails')?$('chkLimDetails').checked:false,
    chkLimPhotos: $('chkLimPhotos')?$('chkLimPhotos').checked:false
  };

  let scrollToAssetId = null;
  if(editIndex !== null){
    // Preserve original index record replacement
    r.inspected = (data.records[editIndex] && typeof data.records[editIndex].inspected === 'boolean') ? data.records[editIndex].inspected : false;
    data.records[editIndex] = {...data.records[editIndex],...r};
    scrollToAssetId = r.assetId;
    editIndex = null;
    $('btnAddAsset').textContent = 'Add asset';
    $('btnCancelEdit').style.display = 'none';
    $('addMsg').textContent = 'Asset updated.';
  } else {
    data.records.push(r);
    $('addMsg').textContent = 'Asset added.';
  }

  sortAssets(); renumber(); save(); render(); updateProgress();
  clearForm();
  if(scrollToAssetId){
    setTimeout(()=>{
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(String(scrollToAssetId)) : String(scrollToAssetId).replace(/"/g,'\\"');
      const target = document.querySelector(`[data-asset-id="${safeId}"]`);
      if(target) target.scrollIntoView({behavior:'smooth',block:'center'});
    },150);
  }
  setTimeout(()=>{$('addMsg').textContent='';},900);
});
$('btnClearAsset').addEventListener('click',clearForm);
$('btnCancelEdit').addEventListener('click',()=>{
  editIndex = null;
  $('btnAddAsset').textContent = 'Add asset';
  $('btnCancelEdit').style.display = 'none';
  clearForm();
});
$('btnSave').addEventListener('click',()=>{save();$('addMsg').textContent="Saved.";setTimeout(()=>{$('addMsg').textContent="";},700);});
$('btnExport').addEventListener('click',exportJSON);
$('btnExportDraft').addEventListener('click',downloadJSON);
$('btnCloseReview').addEventListener('click',()=>$('exportReview').classList.add('hidden'));
$('fileImport').addEventListener('change',(e)=>{if(e.target.files?.[0])importJSON(e.target.files[0]);});
$('btnBuildText').addEventListener('click',buildCopy);
$('btnCopy').addEventListener('click',async ()=>{buildCopy();try{await navigator.clipboard.writeText($('copyText').value);}catch(e){}});
$('btnSort').addEventListener('click',()=>{sortAssets();save();render();});
$('btnRenumber').addEventListener('click',()=>{renumber();save();render();});
$('btnNew').addEventListener('click',()=>{if(confirm("Start a new inspection? This clears all assets on this device.")){data={meta:{inspectorCompany:'Stage Electrics'},records:[]};editIndex=null;populateMeta();save();$('btnAddAsset').textContent='Add asset';$('btnCancelEdit').style.display='none';
load();clearForm();}});
$('btnPrint').addEventListener('click',printable);
$('btnWord').addEventListener('click',exportWord);
metaFields.forEach(id=>$(id).addEventListener('input',save));
assetQuestions.forEach(([key])=>$(key).addEventListener('change',()=>{showAssetConfirmation();save();}));
$('allAssetsAddedConfirmed').addEventListener('change',save);
$('btnCancelEdit').style.display='none';
load();clearForm();showBlocks();}
init();
try{$('infoModalClose').addEventListener('click',hideInfo);$('infoModal').addEventListener('click',(ev)=>{if(ev.target && ev.target.id==='infoModal') hideInfo();});}catch(e){}
