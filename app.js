let performRows = [];
let transportRows = [];
let rowId = 0;

// ── 行追加 ──
function addPerformRow() {
  const id = rowId++;
  performRows.push({ id, date:'', name:'', count:'1', from:'', to:'', place:'', scene:'', price:'', note:'' });
  renderPerformEditor();
  renderPreview();
}

function addTransportRow() {
  const id = rowId++;
  transportRows.push({ id, date:'', name:'', count:'', route:'', price:'', note:'', autoNote:true });
  renderTransportEditor();
  renderPreview();
}

// ── 行削除 ──
function removePerformRow(id) {
  performRows = performRows.filter(r => r.id !== id);
  renderPerformEditor();
  renderPreview();
}

function removeTransportRow(id) {
  transportRows = transportRows.filter(r => r.id !== id);
  renderTransportEditor();
  renderPreview();
}

// ── 行更新 ──
function updatePerformRow(id, field, val) {
  const r = performRows.find(r => r.id === id);
  if (r) r[field] = val;
  renderPreview();
}

// 交通費の行更新：往復チェックがONのときだけ、単価変更時に備考欄へ
// 「片道◯◯円」を自動入力する。編集パネル全体は再描画せず、備考inputだけを
// ピンポイントで書き換えることで入力中にフォーカスが外れる問題を防ぐ。
function updateTransportRow(id, field, val) {
  const r = transportRows.find(r => r.id === id);
  if (!r) return;
  r[field] = val;

  if (field === 'price' && r.autoNote) {
    const price = parseFloat(val) || 0;
    r.note = price > 0 ? `片道${Math.round(price / 2).toLocaleString()}円` : '';
    const noteInput = document.querySelector(`input[data-note-id="${id}"]`);
    if (noteInput) noteInput.value = r.note;
  }

  renderPreview();
}

// 往復／片道の自動計算チェックボックスが切り替えられたとき
function toggleAutoNote(id, checked) {
  const r = transportRows.find(r => r.id === id);
  if (!r) return;
  r.autoNote = checked;

  if (checked) {
    const price = parseFloat(r.price) || 0;
    r.note = price > 0 ? `片道${Math.round(price / 2).toLocaleString()}円` : '';
  } else {
    r.note = '';
  }

  renderTransportEditor();
  renderPreview();
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 出演料用フィールド
function inpPerform(label, field, id, placeholder, type='text') {
  const val = performRows.find(r => r.id === id)?.[field] || '';
  return `<div class="field-group">
    <label>${label}</label>
    <input type="${type}" value="${esc(val)}" placeholder="${placeholder}"
      oninput="updatePerformRow(${id},'${field}',this.value)" />
  </div>`;
}

// 交通費用フィールド（備考はautoNoteがONのときだけ自動入力・読み取り専用）
function inpTransport(label, field, id, placeholder, type='text', isNoteField=false) {
  const r = transportRows.find(r => r.id === id);
  const val = r?.[field] || '';
  const readonly = isNoteField && r?.autoNote;
  const cls = readonly ? 'auto-filled' : '';
  const ro = readonly ? 'readonly' : '';
  const dataAttr = isNoteField ? `data-note-id="${id}"` : '';
  return `<div class="field-group">
    <label>${label}</label>
    <input type="${type}" value="${esc(val)}" placeholder="${placeholder}" class="${cls}" ${ro} ${dataAttr}
      oninput="updateTransportRow(${id},'${field}',this.value)" />
    ${readonly ? '<div class="auto-hint">単価の半額を自動入力</div>' : ''}
  </div>`;
}

// ── 出演料エディタ ──
function renderPerformEditor() {
  const c = document.getElementById('perform-rows-container');
  c.innerHTML = performRows.map(r => `
    <div class="row-editor">
      <button class="del" onclick="removePerformRow(${r.id})">×</button>
      <div class="row-grid">
        <div>${inpPerform('月日','date',r.id,'10/22')}</div>
        <div>${inpPerform('名前','name',r.id,'古賀 太郎')}</div>
        <div>${inpPerform('人数','count',r.id,'12','number')}</div>
        <div>${inpPerform('開始','from',r.id,'8:30')}</div>
        <div>${inpPerform('終了','to',r.id,'15:30')}</div>
        <div>${inpPerform('場所','place',r.id,'入間基地')}</div>
        <div>${inpPerform('シーン','scene',r.id,'模擬患者')}</div>
        <div>${inpPerform('単価','price',r.id,'24600','number')}</div>
        <div class="wide">${inpPerform('備考','note',r.id,'')}</div>
      </div>
    </div>
  `).join('');
}

// ── 交通費エディタ ──
function renderTransportEditor() {
  const c = document.getElementById('transport-rows-container');
  c.innerHTML = transportRows.map(r => `
    <div class="row-editor">
      <button class="del" onclick="removeTransportRow(${r.id})">×</button>
      <div class="row-grid">
        <div>${inpTransport('月日','date',r.id,'10/22')}</div>
        <div>${inpTransport('名前','name',r.id,'古賀 太郎')}</div>
        <div>${inpTransport('人数','count',r.id,'12','number')}</div>
        <div class="wide">${inpTransport('経路','route',r.id,'12名（稲荷山公園駅〜池袋）')}</div>
        <div>${inpTransport('単価（往復）','price',r.id,'980','number')}</div>
        <div class="wide checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" ${r.autoNote ? 'checked' : ''} onchange="toggleAutoNote(${r.id}, this.checked)" />
            片道料金を備考に自動計算する
          </label>
        </div>
        <div class="wide">${inpTransport(r.autoNote ? '備考（自動）' : '備考','note',r.id,r.autoNote ? '片道490円' : '備考を入力',  'text', true)}</div>
      </div>
    </div>
  `).join('');
}

// ── 日付 ──
function fmtDate() {
  const d = new Date();
  const reiwa = d.getFullYear() - 2018;
  return `令和　${reiwa}　年　　${d.getMonth()+1}　月　${d.getDate()}　日`;
}

function ftRow(label, val, cls='') {
  return `<tr>
    <td colspan="8" class="nb"></td>
    <td colspan="2" class="ft-label ${cls}">${label}</td>
    <td class="ft-val ${cls}">${val}</td>
  </tr>`;
}

// ── プレビュー描画 ──
function renderPreview() {
  const g = id => document.getElementById(id)?.value || '';
  document.getElementById('p-to').textContent = g('to') || '宛先';
  document.getElementById('p-project').textContent = g('project') || '案件名';
  document.getElementById('p-date').textContent = fmtDate();

  const taxrate = parseFloat(document.getElementById('taxrate')?.value) || 10;
  const COLS = 11;
  const empty = () => `<tr>${'<td></td>'.repeat(COLS)}</tr>`;
  const span = (text, cls='') =>
    `<tr><td colspan="${COLS}" class="section-header ${cls}">${text}</td></tr>`;

  // ── 出演料セクション ──
  let performSubtotal = 0;
  let performHtml = span('出演料', 'section-perform');

  performRows.forEach(r => {
    const price = parseFloat(r.price) || 0;
    const count = parseInt(r.count) || 1;
    const total = price * count;
    performSubtotal += total;
    performHtml += `<tr>
      <td>${esc(r.date)}</td>
      <td class="left">${esc(r.name)}</td>
      <td>${esc(r.count)}</td>
      <td>${esc(r.from)}</td>
      <td>〜</td>
      <td>${esc(r.to)}</td>
      <td>${esc(r.place)}</td>
      <td>${esc(r.scene)}</td>
      <td class="right">${price ? price.toLocaleString() : ''}</td>
      <td class="right">${total ? total.toLocaleString() : ''}</td>
      <td class="left">${esc(r.note)}</td>
    </tr>`;
  });

  // 出演料：明細直後に空行を挟んでから、すぐ右下に集計を表示
  for (let i = performRows.length; i < Math.max(performRows.length + 1, 2); i++) {
    performHtml += empty();
  }

  const performTax = Math.round(performSubtotal * taxrate / 100);
  const performGrand = performSubtotal + performTax;

  performHtml += ftRow('出演料', performSubtotal.toLocaleString());
  performHtml += ftRow(`消費税　${taxrate} %`, performTax.toLocaleString());
  performHtml += ftRow('総計 ①', `¥${performGrand.toLocaleString()}`, 'ft-sub');

  document.getElementById('p-perform-section').innerHTML = performHtml;

  // ── 交通費セクション ──
  let transportSubtotal = 0;
  let transportHtml = span('交通費', 'section-transport');

  transportRows.forEach(r => {
    const price = parseFloat(r.price) || 0;
    const count = parseInt(r.count) || 1;
    const total = price * count;
    transportSubtotal += total;
    transportHtml += `<tr>
      <td>${esc(r.date)}</td>
      <td class="left">${esc(r.name)}</td>
      <td>${esc(r.count)}</td>
      <td class="left" colspan="4">${esc(r.route)}</td>
      <td></td>
      <td class="right">${price ? price.toLocaleString() : ''}</td>
      <td class="right">${total ? total.toLocaleString() : ''}</td>
      <td class="left">${esc(r.note)}</td>
    </tr>`;
  });

  // 交通費：明細直後に空行を挟んでから集計（出演料と同じパターン）
  for (let i = transportRows.length; i < Math.max(transportRows.length + 2, 3); i++) {
    transportHtml += empty();
  }

  const transportInnerTax = Math.round(transportSubtotal * taxrate / 100);

  transportHtml += ftRow('交通費 ②', `¥${transportSubtotal.toLocaleString()}`);
  transportHtml += ftRow(`内税　${taxrate} %`, transportInnerTax.toLocaleString());

  // 以下余白 → 空行 → 一番右下に総計（①＋②）
  transportHtml += `<tr><td class="left" colspan="${COLS}">以下余白</td></tr>`;
  for (let i = 0; i < 2; i++) transportHtml += empty();

  const grand = performGrand + transportSubtotal;
  transportHtml += ftRow('総計（①＋②）', `¥${grand.toLocaleString()}`, 'ft-grand');

  document.getElementById('p-transport-section').innerHTML = transportHtml;
  document.getElementById('p-grand-foot').innerHTML = '';

  document.getElementById('p-total').textContent = `¥${grand.toLocaleString()}`;
}

// ── クリア ──
function clearAll() {
  if (!confirm('宛先・案件名・明細をすべてリセットしますか？')) return;
  document.getElementById('to').value = '';
  document.getElementById('project').value = '';
  performRows = [];
  transportRows = [];
  rowId = 0;
  renderPerformEditor();
  renderTransportEditor();
  renderPreview();
}

// ── PDF ──
async function downloadPDF() {
  const btn = document.getElementById('dl-btn');
  btn.disabled = true;
  btn.textContent = '生成中...';

  try {
    const el = document.getElementById('quote-paper');

    const canvas = await html2canvas(el, {
      scale: 0.9,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.00);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    let w = pageW - 10;
    let h = w / ratio;
    if (h > pageH - 10) { h = pageH - 10; w = h * ratio; }

    pdf.addImage(imgData, 'JPEG', (pageW - w) / 2, 5, w, h);

    const project = document.getElementById('project')?.value || '見積書';
    pdf.save(`${project}_見積書（出演料＋交通費）.pdf`);
  } catch (e) {
    alert('PDF生成に失敗しました: ' + e.message);
  }

  btn.disabled = false;
  btn.textContent = '↓ PDFをダウンロード';
}

// ── イベント ──
['to','project','taxrate'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', renderPreview);
});

// ── 初期化 ──
addPerformRow();
addTransportRow();
renderPreview();
