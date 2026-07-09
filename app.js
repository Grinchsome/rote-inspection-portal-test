
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
const escapeHtml=(s)=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const idKey=(v)=>{const m=String(v||"").match(/(\d+)/);return m?parseInt(m[1],10):1e12;};
const selectedMulti=(sel)=>Array.from(sel.selectedOptions).map(o=>o.value);
function save(){
  data.meta.customer = $('customer').value || "";
  data.meta.site = $('site').value || "";
  data.meta.space = $('space').value || "";
  data.meta.inspectionDate = $('inspectionDate').value || "";
  data.meta.reportOutcome = $('reportOutcome').value || "";
  localStorage.setItem("rote_mobile_inspector_v1", JSON.stringify(data));
}
function load(){
  try{
    const raw = localStorage.getItem("rote_mobile_inspector_v1");
    if(raw) data = JSON.parse(raw);
  }catch(e){}
  if(!data.meta) data.meta = {customer:"",site:"",space:"",inspectionDate:"",reportOutcome:""};
  if(data.meta.inspectionDate && !data.meta.inspectionDate){ data.meta.inspectionDate = data.meta.inspectionDate; }
  if(!('customer' in data.meta)) data.meta.customer = "";
  if(!('inspectionDate' in data.meta)) data.meta.inspectionDate = "";
  if(!('reportOutcome' in data.meta)) data.meta.reportOutcome = "";
  $('customer').value = data.meta.customer || "";
  $('site').value = data.meta.site || "";
  $('space').value = data.meta.space || "";
  $('inspectionDate').value = data.meta.inspectionDate || "";
  $('reportOutcome').value = data.meta.reportOutcome || "";
  render();
}
function fillSelect(sel,items){sel.innerHTML="";for(const it of items){const o=document.createElement("option");o.value=it;o.textContent=it;sel.appendChild(o);}}
function fillDatalist(dl,items){dl.innerHTML="";for(const it of items){const o=document.createElement("option");o.value=it;dl.appendChild(o);}}
function showBlocks(){const adv=$('cAdv').checked, fail=$('cFail').checked, lim=$('cLim').checked;
$('advBlock').classList.toggle('hidden',!adv);$('failBlock').classList.toggle('hidden',!fail);$('limBlock').classList.toggle('hidden',!lim);
$('failChecklistOnly').classList.toggle('hidden',adv);}
function clearForm(){['assetId','assetDesignation','assetDesignationOther','customerAssetId','typeNotes','loadInfo','advNotes','failOther','failNotes','limDetails','limNotes','thisInspection','assetTypeInput'].forEach(id=>{const el=$(id); if(el) el.value='';});
['cPass','cFail','cAdv','cLim','chkGenericPhotos','chkFixingsPhotos','chkObsPhotos','chkRemedial','chkGenericPhotosF','chkFixingsPhotosF','chkObsPhotosF','chkRemedialF','chkLimDetails','chkLimPhotos'].forEach(id=>{const el=$(id); if(el) el.checked=false;});
if($('advActions')) $('advActions').selectedIndex=-1;if($('failDefects')) $('failDefects').selectedIndex=-1;if($('failOtherWrap')) $('failOtherWrap').classList.add('hidden');if($('assetTypeInput')) $('assetTypeInput').value='';
showBlocks();$('addMsg').textContent="";}
function sortAssets(){data.records.sort((a,b)=>idKey(a.assetId)-idKey(b.assetId));}
function renumber(){data.records.forEach((r,i)=>r.assetNo=i+1);}
function badge(t){return `<span class="badge">${t}</span>`;}

function showInfo(kind, text){
  const modal = $('infoModal');
  if(!modal) return;
  const titleEl = $('infoModalTitle');
  const bodyEl = $('infoModalBody');
  const titles = {adv:'Advisory (previous)', fail:'Fail (previous)', lim:'Limitation (previous)'};
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
data.records.forEach((r,i)=>{const div=document.createElement('div');div.className='assetItem';div.setAttribute('data-asset-id', r.assetId || '');
const conds=[];if(r.pass)conds.push('Pass');if(r.advisory)conds.push('Advisory');if(r.limitation)conds.push('Limitation');if(r.fail)conds.push('Fail');
div.innerHTML=`<div class="assetHead"><div><div><strong>Asset ${r.assetNo||i+1}</strong> — ID ${escapeHtml(r.assetId||"")}${r.assetDesignation?(' — '+escapeHtml(r.assetDesignation)+(r.assetDesignationOther?' ('+escapeHtml(r.assetDesignationOther)+')':'')):''}${r.customerAssetId?(' — Customer Asset ID: '+escapeHtml(r.customerAssetId)):''} — ${escapeHtml(r.assetType||"")}</div>${r.typeNotes?`<div class="small">Notes: ${escapeHtml(r.typeNotes)}</div>`:""}</div>
<div class="badges">${conds.map(badge).join("")}</div></div>
<div class="row" style="margin-top:10px"><label class="small" style="display:flex;align-items:center;gap:8px;margin-right:10px;"><input type="checkbox" data-inspected="${i}" ${r.inspected?"checked":""}> Inspected</label>
        ${((r.prevAdv||(r.advActions&&r.advActions.length)||(r.improvements&&r.improvements.length)) || (r.prevFail||(r.failDefects&&r.failDefects.length)||(r.defects&&r.defects.length)) || (r.prevLim||r.limDetails||r.limNotes||(r.limitations&&r.limitations.length)))?`<div class=\"row noSelect\" style=\"gap:10px;flex-wrap:wrap;margin-top:6px\">${(r.prevAdv||(r.advActions&&r.advActions.length)||(r.improvements&&r.improvements.length))?`<button type=\"button\" class=\"tagBtn\" data-info=\"adv\" data-i=\"${i}\">View advisory</button>`:''}${(r.prevFail||(r.failDefects&&r.failDefects.length)||(r.defects&&r.defects.length))?`<button type=\"button\" class=\"tagBtn\" data-info=\"fail\" data-i=\"${i}\">View fail</button>`:''}${(r.prevLim||r.limDetails||r.limNotes||(r.limitations&&r.limitations.length))?`<button type=\"button\" class=\"tagBtn\" data-info=\"lim\" data-i=\"${i}\">View limitation</button>`:''}</div>`:''}
        <button class="btn" data-edit="${i}">Edit</button>
        <button class="btn danger" data-del="${i}">Delete</button></div>`;
host.appendChild(div);});
host.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{const i=parseInt(btn.getAttribute('data-del'),10);data.records.splice(i,1);renumber();save();render();}));
host.querySelectorAll('[data-info]').forEach(btn=>{
  const open = (ev)=>{ ev.preventDefault(); ev.stopPropagation();
    const i=parseInt(btn.getAttribute('data-i'),10);
    const kind=btn.getAttribute('data-info');
    const a=data.records[i]; if(!a) return;
    let msg='';
    if(kind==='adv') msg = a.prevAdv || (a.advActions||[]).join('\n') || '';
    if(kind==='fail') msg = a.prevFail || (a.failDefects||[]).join('\n') || '';
    if(kind==='lim') msg = a.prevLim || a.limDetails || a.limNotes || (a.limitations||[]).join('\\n') || '';
    showInfo(kind, msg || '(no details)');
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
  }));

host.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{
  const i=parseInt(btn.getAttribute('data-edit'),10);
  const a=data.records[i]; if(!a) return;
  editIndex = i;
  $('assetId').value = a.assetId||'';
  if($('assetDesignation')) $('assetDesignation').value = a.assetDesignation||'';
  if($('assetDesignationOther')) $('assetDesignationOther').value = a.assetDesignationOther||'';
  if($('customerAssetId')) $('customerAssetId').value = a.customerAssetId||'';
  if($('assetDesignationOtherWrap')) $('assetDesignationOtherWrap').classList.toggle('hidden', (a.assetDesignation||'') !== 'Other');
  $('assetTypeInput').value = a.assetType||'Other';
  $('typeNotes').value = a.typeNotes||'';
  if($('loadInfo')) $('loadInfo').value = a.loadInfo||'';
  $('cPass').checked = !!a.pass;
  $('cFail').checked = !!a.fail;
  $('cAdv').checked = !!a.advisory;
  $('cLim').checked = !!a.limitation;
  // restore multiselects
  if($('advActions')) Array.from($('advActions').options).forEach(o=>o.selected = (a.advActions||[]).includes(o.value));
  if($('advNotes')) $('advNotes').value = a.advNotes||'';
  if($('prevAdv')) $('prevAdv').value = a.prevAdv || (a.advActions||[]).join('\n');
  if($('failDefects')) Array.from($('failDefects').options).forEach(o=>o.selected = (a.failDefects||[]).includes(o.value));
  if($('failOther')) $('failOther').value = a.failOther||'';
  if($('failNotes')) $('failNotes').value = a.failNotes||'';
  if($('prevFail')) $('prevFail').value = a.prevFail || (a.failDefects||[]).join('\n');
  if($('limDetails')) $('limDetails').value = a.limDetails || a.limitationDetails || '';
  if($('limNotes')) $('limNotes').value = a.limNotes||'';
  if($('prevLim')) $('prevLim').value = a.prevLim || a.limNotes || '';
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
if(m.reportOutcome)lines.push(`Report outcome: ${m.reportOutcome}`.trim());lines.push("");
for(const r of data.records){
lines.push(`Asset ${r.assetNo} — ID ${r.assetId}${r.assetDesignation?(' — '+r.assetDesignation):''}${r.assetDesignationOther?(' ('+r.assetDesignationOther+')'):''}${r.customerAssetId?(' — Customer Asset ID: '+r.customerAssetId):''} — ${r.assetType}`.trim());
const c=[];if(r.pass)c.push("Pass");if(r.advisory)c.push("Advisory");if(r.limitation)c.push("Limitation");if(r.fail)c.push("Fail");
lines.push(`Condition: ${c.join(" + ")}`.trim());
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
function exportJSON(){save();const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);
a.download=`${(data.meta.site||"inspection").replaceAll(" ","_")}-inspection.json`;a.click();URL.revokeObjectURL(a.href);}
function importJSON(file){
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const obj=JSON.parse(rd.result);
      if(obj && obj.records){
        // merge meta into current fields (some exporters use different key names)
        if(obj.meta){
          const om=obj.meta;
          data.meta = data.meta || {};
          data.meta.customer = om.customer || om.Customer || '';
          data.meta.site = om.site || om.site_and_space || om.siteAndSpace || '';
          data.meta.space = om.space || '';
          data.meta.inspectionDate = om.inspectionDate || om.date || om.reportDate || '';
          data.meta.reportOutcome = om.reportOutcome || om.report_outcome || om.outcome || '';
          if($('customer')) $('customer').value = data.meta.customer;
          if($('site')) $('site').value = data.meta.site;
          if($('space')) $('space').value = data.meta.space;
          if($('inspectionDate')) $('inspectionDate').value = data.meta.inspectionDate;
          if($('reportOutcome')) $('reportOutcome').value = data.meta.reportOutcome;
        }
        // ensure per-record fields exist
        data.records = (obj.records||[]).map(r=>{
          const rr = {inspected:false,
      prevAdv:'',prevFail:'',prevLim:'', ...r};
          rr.prevAdv = rr.prevAdv || rr.advDetails || rr.advisoryDetails || (rr.advActions && rr.advActions.length ? rr.advActions.join('\\n') : '') || (rr.improvements && rr.improvements.length ? rr.improvements.join('\\n') : '') || '';
          rr.prevFail = rr.prevFail || rr.failDetails || rr.defectDetails || (rr.failDefects && rr.failDefects.length ? rr.failDefects.join('\\n') : '') || (rr.defects && rr.defects.length ? rr.defects.join('\\n') : '') || '';
          rr.assetDesignationOther = rr.assetDesignationOther || '';
          rr.customerAssetId = rr.customerAssetId || '';
          rr.limDetails = rr.limDetails || rr.limitationDetails || '';
          rr.prevLim = rr.prevLim || rr.limDetails || rr.limitationDetails || (rr.limNotes ? rr.limNotes : '') || (rr.limitations && rr.limitations.length ? rr.limitations.join('\\n') : '') || '';
          return rr;
        });
        save();
        if($('btnCancelEdit')) $('btnCancelEdit').style.display='none';
        sortAssets(); renumber(); render(); updateProgress();
      }
    }catch(e){}
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
const cfg=await fetch('./data.json?v=271', {cache:'no-store'}).then(r=>r.json());
fillDatalist($('assetTypeList'),cfg.assetTypes);fillSelect($('advActions'),cfg.advisoryActions);fillSelect($('failDefects'),cfg.failDefects);
['cAdv','cFail','cLim'].forEach(id=>$(id).addEventListener('change',showBlocks));
if($('assetDesignation')) $('assetDesignation').addEventListener('change',()=>{
  const wrap=$('assetDesignationOtherWrap');
  if(wrap) wrap.classList.toggle('hidden', $('assetDesignation').value !== 'Other');
});
$('failDefects').addEventListener('change',()=>{const opts=selectedMulti($('failDefects')).map(s=>s.toLowerCase());
$('failOtherWrap').classList.toggle('hidden',!opts.some(s=>s.startsWith('other')));});

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
    chkGenericPhotos: $('chkGenericPhotos')?$('chkGenericPhotos').checked:false,
    chkFixingsPhotos: $('chkFixingsPhotos')?$('chkFixingsPhotos').checked:false,
    chkObsPhotos: $('chkObsPhotos')?$('chkObsPhotos').checked:false,
    chkRemedial: $('chkRemedial')?$('chkRemedial').checked:false,
    chkLimDetails: $('chkLimDetails')?$('chkLimDetails').checked:false,
    chkLimPhotos: $('chkLimPhotos')?$('chkLimPhotos').checked:false
  };

  let scrollToAssetId = null;
  if(editIndex !== null){
    // Preserve original index record replacement
    r.inspected = (data.records[editIndex] && typeof data.records[editIndex].inspected === 'boolean') ? data.records[editIndex].inspected : false;
    data.records[editIndex] = r;
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
$('fileImport').addEventListener('change',(e)=>{if(e.target.files?.[0])importJSON(e.target.files[0]);});
$('btnBuildText').addEventListener('click',buildCopy);
$('btnCopy').addEventListener('click',async ()=>{buildCopy();try{await navigator.clipboard.writeText($('copyText').value);}catch(e){}});
$('btnSort').addEventListener('click',()=>{sortAssets();save();render();});
$('btnRenumber').addEventListener('click',()=>{renumber();save();render();});
$('btnNew').addEventListener('click',()=>{if(confirm("Start a new inspection? This clears all assets on this device.")){data={meta:{site:"",space:"",inspectionDate:""},records:[]};save();$('btnCancelEdit').style.display='none';
load();clearForm();}});
$('btnPrint').addEventListener('click',printable);
$('btnWord').addEventListener('click',exportWord);
['customer','site','space','inspectionDate','reportOutcome'].forEach(id=>$(id).addEventListener('input',save));
$('btnCancelEdit').style.display='none';
load();clearForm();showBlocks();}
init();
try{$('infoModalClose').addEventListener('click',hideInfo);$('infoModal').addEventListener('click',(ev)=>{if(ev.target && ev.target.id==='infoModal') hideInfo();});}catch(e){}

