const responsive_menu_btn = document.querySelector('.responsive_btn');

if (responsive_menu_btn) {
  responsive_menu_btn.addEventListener('click', menuToggle);
}

function menuToggle() {
  const pcMenu = document.querySelector('.main-nav');
  const spMenu = document.querySelector('.main-nav-sp');

  if (pcMenu) pcMenu.classList.toggle('menu_active');
  if (spMenu) spMenu.classList.toggle('menu_active');
  responsive_menu_btn.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {

    // 💡公開用（Sheet2）のCSV用URL
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwd-NfW52i7COyA23A_pbCIR6M-ZN8zpMdV4iW299l1NwR2VMnVKS8Ri1grVMkyLHtaRadoeJaRIfo/pub?gid=453089662&single=true&output=csv';

    const container = document.getElementById('zemi-results-container');
    if(!container) return;

    container.innerHTML = '<p style="text-align: center; color: #cecece;">現在の希望状況を読み込んでいます...</p>';

    const areaPhysics = document.getElementById('area-physics');
    const areaMath = document.getElementById('area-math');
    const areaChemBio = document.getElementById('area-chem-bio'); 
    const areaOther = document.getElementById('area-other');

    if (areaPhysics) areaPhysics.innerHTML = '';
    if (areaMath) areaMath.innerHTML = '';
    if (areaChemBio) areaChemBio.innerHTML = ''; 
    if (areaOther) areaOther.innerHTML = '';

    fetch(sheetUrl)
        .then(response => response.text())
        .then(csvText => {
            const allRows = parseCSV(csvText);
            
            // 💡ここで「第1希望順 → 第2希望順」の辞書式ソートを行います
            const dataRows = allRows.slice(1)
                .filter(row => row[0]) 
                .sort((a, b) => {
                    const firstA = Number(a[1]) || 0;
                    const firstB = Number(b[1]) || 0;
                    const secondA = Number(a[2]) || 0;
                    const secondB = Number(b[2]) || 0;
                    
                    if (firstB !== firstA) {
                        return firstB - firstA; // 第1希望で比較
                    }
                    return secondB - secondA;   // 同数なら第2希望で比較
                });

            // 💡 質問2のフォーム用のボタン生成（全件一括で実行）
            dataRows.forEach(row => {
                const fieldName = row[0];
                const tagsField = row[4] || '';
                const btnHtml = `<button type="button" class="field-btn" onclick="selectField('${fieldName}')">${fieldName}</button> `;
                
                let hasMainTag = false; 

                if (tagsField.includes('物理') && areaPhysics) {
                    areaPhysics.insertAdjacentHTML('beforeend', btnHtml);
                    hasMainTag = true;
                }
                if (tagsField.includes('数学') && areaMath) {
                    areaMath.insertAdjacentHTML('beforeend', btnHtml);
                    hasMainTag = true;
                }
                if ((tagsField.includes('化学') || tagsField.includes('生物')) && areaChemBio) {
                    areaChemBio.insertAdjacentHTML('beforeend', btnHtml);
                    hasMainTag = true;
                }
                if ((tagsField.includes('その他') || !hasMainTag) && areaOther) {
                    areaOther.insertAdjacentHTML('beforeend', btnHtml);
                }
            });

            // 💡 ページネーション（ページ切り替え）用にデータを保存して1ページ目を描画
            window.zemiDataRows = dataRows;
            renderZemiPage(1);

        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = '<p style="text-align: center; color: #cecece;">データの読み込みに失敗しました。</p>';
        });
});

// 💡 指定したページ番号のゼミ一覧を描画する関数
window.renderZemiPage = function(page) {
    const container = document.getElementById('zemi-results-container');
    if (!container || !window.zemiDataRows) return;

    const itemsPerPage = 10; // 💡 1ページあたりの表示数（10個）
    const totalPages = Math.ceil(window.zemiDataRows.length / itemsPerPage) || 1;

    // ページ番号が範囲外にならないように補正
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = window.zemiDataRows.slice(startIndex, endIndex);

    if (window.zemiDataRows.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #cecece;">現在、希望分野はまだありません。</p>';
        return;
    }

    let html = '';
    let paginationHtml = ''; // 上下で使い回すために変数を外に出します

    // 💡 ページネーション（前へ・次へボタン）の生成
    if (totalPages > 1) {
        paginationHtml += '<div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 1.5rem;">';
        
        // 前へボタン
        if (page > 1) {
            paginationHtml += `<button onclick="renderZemiPage(${page - 1})" style="background: #555; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">&lt; 前へ</button>`;
        } else {
            paginationHtml += `<button style="background: #333; color: #777; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>&lt; 前へ</button>`;
        }

        // 現在のページ / 全ページ
        paginationHtml += `<span style="color: #cecece; font-weight: bold; font-size: 1.1rem;">${page} / ${totalPages}</span>`;

        // 次へボタン
        if (page < totalPages) {
            paginationHtml += `<button onclick="renderZemiPage(${page + 1})" style="background: #555; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">次へ &gt;</button>`;
        } else {
            paginationHtml += `<button style="background: #333; color: #777; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>次へ &gt;</button>`;
        }

        paginationHtml += '</div>';
        html += paginationHtml; // 💡カード一覧の「上」にHTMLを追加する
    }

    html += '<div class="zemi-grid-container">';

    pageData.forEach(row => {
        const fieldName = row[0];
        const first = Number(row[1]) || 0;
        const second = Number(row[2]) || 0;
        
        let description = (row[3] || '').trim();
        if (description === '' || description === '#N/A') {
            description = '概要はまだありません。';
        }

        let borderColor = '#555'; 
        let badgeHtml = '';

        if (first >= 4) {
            borderColor = '#ff6b6b'; 
            badgeHtml = '<span style="background: #ff6b6b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">班成立！</span>';
        } else if (first >= 3) {
            borderColor = '#91b825'; 
            badgeHtml = '<span style="background: #91b825; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">もう少し！</span>';
        }

        html += `
        <div class="zemi-card-sp" style="background: rgba(255,255,255,0.05); border: 2px solid ${borderColor}; border-radius: 8px; padding: 1rem; height: 100%; box-sizing: border-box;">
            <h3 style="margin: 0 0 0.8rem 0; font-size: 1.1rem; color: #fff;">
                ${fieldName} ${badgeHtml}
            </h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem;">
                <span style="background: #e6b422; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">第1希望: ${first}人</span>
                <span style="background: #999; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">第2希望: ${second}人</span>
            </div>
            <details style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px;">
                <summary style="cursor: pointer; font-weight: bold; color: #cecece; font-size: 0.9rem; outline: none;">概要を見る</summary>
                <p style="margin-top: 0.5rem; margin-bottom: 0; color: #bbb; font-size: 0.85rem; line-height: 1.5;">
                    ${description.replace(/\n/g, '<br>')}
                </p>
            </details>
        </div>`;
    });

    html += '</div>'; // グリッドの終了

    // 💡カード一覧の「下」にも同じボタンを追加する（余白設定だけ調整）
    if (totalPages > 1) {
        html += paginationHtml.replace('margin-bottom: 1.5rem;', 'margin-top: 1.5rem; margin-bottom: 0;');
    }

    container.innerHTML = html;
};

// CSVパース関数
function parseCSV(str) {
    const result = [];
    let row = [], inQuotes = false, val = "";
    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (inQuotes) {
            if (c === '"' && str[i+1] === '"') { val += '"'; i++; }
            else if (c === '"') { inQuotes = false; }
            else { val += c; }
        } else {
            if (c === '"') { inQuotes = true; }
            else if (c === ',') { row.push(val); val = ""; }
            else if (c === '\n' || c === '\r') {
                row.push(val); val = ""; result.push(row); row = [];
                if (c === '\r' && str[i+1] === '\n') i++;
            }
            else { val += c; }
        }
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    return result;
}

// ゼミ班アコーディオン（仕様として残しておきます）
function setupAccordion(headerClass, itemClass, contentClass) {
  document.querySelectorAll(headerClass).forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      document.querySelectorAll(itemClass).forEach((el) => {
        if (el !== item) {
          el.classList.remove('active');
          const c = el.querySelector(contentClass);
          if (c) c.style.maxHeight = null;
        }
      });
      item.classList.toggle('active');
      const content = item.querySelector(contentClass);
      if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = null;
      }
    });
  });
}

setupAccordion('.accordion-header', '.accordion-item', '.accordion-content');
setupAccordion('.accordion-header-sp', '.accordion-item-sp', '.accordion-content-sp');

/* =========================================================
   新システム（提案＆希望選択フォーム）の処理
========================================================= */
let kibou1 = "";
let kibou2 = "";

// 💡 追加：自動連動用のフラグ変数
let isKibou1Proposal = false;
let isKibou2Proposal = false;

document.addEventListener("DOMContentLoaded", () => {
  const inputBunya = document.getElementById("input-bunya");
  if (inputBunya) {
    inputBunya.addEventListener("input", updateProposalButton);
  }

  // 💡 HTML側の onclick ではなく、JS側で「自分が提案したフラグ」付きのクリック処理を設定する
  const btnMyProposal = document.getElementById("btn-my-proposal");
  if (btnMyProposal) {
    btnMyProposal.removeAttribute("onclick");
    btnMyProposal.addEventListener("click", () => {
      const val = document.getElementById("input-bunya").value.trim();
      selectField(val, true); // true = 自分が提案した分野であることを示す
    });
  }

  // 必須項目のリアルタイム監視設定
  const requiredIds = ["input-kyomi", "input-x", "input-route", "input-route-other"];
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", checkRequiredFields);
      el.addEventListener("input", checkRequiredFields);
    }
  });

  // 初回起動時にボタンをグレーアウト状態にしておく
  checkRequiredFields();
});

// 必須項目がすべて埋まっているか判定する関数
function checkRequiredFields() {
  const kyomi = document.getElementById("input-kyomi") ? document.getElementById("input-kyomi").value.trim() : "";
  const xSend = document.getElementById("input-x") ? document.getElementById("input-x").value.trim() : "";
  const route = document.getElementById("input-route") ? document.getElementById("input-route").value.trim() : "";
  
  let isValid = true;
  
  // 未入力の項目があれば false（不可）にする
  if (kyomi === "") isValid = false;
  if (xSend === "") isValid = false;
  if (route === "") isValid = false;

  // もし「その他」を選んでいるのに、その他の詳細欄が空っぽなら false
  if (route === "その他") {
      const routeOther = document.getElementById("input-route-other") ? document.getElementById("input-route-other").value.trim() : "";
      if (routeOther === "") isValid = false;
  }

  const submitBtn = document.getElementById("submit-form-btn");
  if (submitBtn) {
    if (isValid) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    } else {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";
      submitBtn.style.cursor = "not-allowed";
    }
  }
}

// 💡 提案分野が入力されたら、ジャンル選択・概要入力欄を表示し、かつ連動させる処理
function updateProposalButton() {
  const val = document.getElementById("input-bunya").value.trim();
  const btn = document.getElementById("btn-my-proposal");
  const hiddenArea = document.getElementById("hidden-proposal-area"); 

  if (val) {
    if (btn) {
      btn.innerText = `「${val}」を希望に設定する`;
      btn.disabled = false;
    }
    if (hiddenArea) {
      hiddenArea.style.display = "block";
    }
  } else {
    if (btn) {
      btn.innerText = "（質問1を入力してください）";
      btn.disabled = true;
    }
    if (hiddenArea) {
      hiddenArea.style.display = "none";
    }
  }

  // 💡 追加：「自分が提案した分野」が希望として選ばれている場合、入力を自動反映させる
  let changed = false;
  if (isKibou1Proposal) {
    kibou1 = val;
    changed = true;
  }
  if (isKibou2Proposal) {
    kibou2 = val;
    changed = true;
  }
  if (changed) {
    updateDisplay();
  }
}

// 💡 追加：第2引数(isProposal)で、提案ボタンから選ばれたか判定できるように修正
function selectField(fieldName, isProposal = false) {
  if (!fieldName || fieldName.trim() === "") return;
  fieldName = fieldName.trim();

  if (!kibou1) {
    kibou1 = fieldName;
    isKibou1Proposal = isProposal; // 第1希望が提案ボタン経由か記録
  } else if (!kibou2 && kibou1 !== fieldName) {
    kibou2 = fieldName;
    isKibou2Proposal = isProposal; // 第2希望が提案ボタン経由か記録
  } else if (kibou1 === fieldName || kibou2 === fieldName) {
    alert("その分野はすでに選択されています。");
  } else {
    alert("すでに第2希望まで選択されています。「選び直す」を押して解除してください。");
  }
  updateDisplay();
}

function clearField(num) {
  if (num === 1) {
    kibou1 = "";
    isKibou1Proposal = false; // 💡 選び直した場合は連動を解除
  }
  if (num === 2) {
    kibou2 = "";
    isKibou2Proposal = false; // 💡 選び直した場合は連動を解除
  }
  updateDisplay();
}

function updateDisplay() {
  const disp1 = document.getElementById("disp-kibou1");
  const disp2 = document.getElementById("disp-kibou2");
  if (disp1) disp1.innerText = kibou1 || "未選択";
  if (disp2) disp2.innerText = kibou2 || "未選択";
}

function toggleXDetail() {
  const xVal = document.getElementById("input-x").value;
  const detailBox = document.getElementById("x-detail-box");
  if (detailBox) detailBox.style.display = (xVal === "宣伝する" || xVal === "はい（呼び掛けを希望する）") ? "block" : "none";
  checkRequiredFields(); 
}

function toggleRouteOther() {
  const routeVal = document.getElementById("input-route").value;
  const routeOther = document.getElementById("input-route-other");
  if (routeOther) routeOther.style.display = (routeVal === "その他") ? "block" : "none";
  checkRequiredFields(); 
}

function openGoogleForm() {
  const bunya = document.getElementById("input-bunya") ? document.getElementById("input-bunya").value : "";
  const genre = document.getElementById("input-genre") ? document.getElementById("input-genre").value : ""; 
  const gaiyou = document.getElementById("input-gaiyou") ? document.getElementById("input-gaiyou").value : "";
  const kyomi = document.getElementById("input-kyomi") ? document.getElementById("input-kyomi").value : "";
  const xSend = document.getElementById("input-x") ? document.getElementById("input-x").value : "";
  const xDetail = document.getElementById("input-x-detail") ? document.getElementById("input-x-detail").value : "";
  const free = document.getElementById("input-free") ? document.getElementById("input-free").value : "";
  
  let route = document.getElementById("input-route") ? document.getElementById("input-route").value : "";
  if (route === "その他") {
    route = document.getElementById("input-route-other") ? document.getElementById("input-route-other").value : "";
  }

  let targetUrl = "https://docs.google.com/forms/d/e/1FAIpQLSc1c_nhPMIGUI0cu3LWzOjzSo6dVhDmn-MGO1FgJJ-fh7Vitg/viewform?usp=pp_url&entry.669942318=+DUMMY_BUNYA&entry.930125208=+DUMMY_GENRE&entry.2097477009=+DUMMY_GAIYOU&entry.1542851026=+DUMMY_KIBOU1&entry.45651459=+DUMMY_KIBOU2&entry.45918589=+DUMMY_KYOMI&entry.1192163566=+DUMMY_X&entry.2036668219=+DUMMY_XDETAIL&entry.375378926=+DUMMY_ROUTE&entry.405628407=+DUMMY_FREE";

  targetUrl = targetUrl.replace("DUMMY_BUNYA", encodeURIComponent(bunya));
  targetUrl = targetUrl.replace("DUMMY_GENRE", encodeURIComponent(genre)); 
  targetUrl = targetUrl.replace("DUMMY_GAIYOU", encodeURIComponent(gaiyou));
  targetUrl = targetUrl.replace("DUMMY_KIBOU1", encodeURIComponent(kibou1));
  targetUrl = targetUrl.replace("DUMMY_KIBOU2", encodeURIComponent(kibou2));
  targetUrl = targetUrl.replace("DUMMY_KYOMI", encodeURIComponent(kyomi));
  targetUrl = targetUrl.replace("DUMMY_X", encodeURIComponent(xSend));
  targetUrl = targetUrl.replace("DUMMY_XDETAIL", encodeURIComponent(xDetail));
  targetUrl = targetUrl.replace("DUMMY_ROUTE", encodeURIComponent(route));
  targetUrl = targetUrl.replace("DUMMY_FREE", encodeURIComponent(free));

  window.open(targetUrl, "_blank");
}

function showProposalForm() {
  const formArea = document.getElementById("proposal-form-area");
  if (formArea) {
    formArea.style.display = "block";
    formArea.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
