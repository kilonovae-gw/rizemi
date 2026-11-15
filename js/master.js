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

    // 💡公開用（集計1）のCSV用URL
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwd-NfW52i7COyA23A_pbCIR6M-ZN8zpMdV4iW299l1NwR2VMnVKS8Ri1grVMkyLHtaRadoeJaRIfo/pub?gid=1076535681&single=true&output=csv';

    const container = document.getElementById('zemi-results-container');
    if(!container) return;

    // 💡 文字色をライトモード用の濃色（#555555）に変更
    container.innerHTML = '<p style="text-align: center; color: #555555;">現在の希望状況を読み込んでいます...</p>';

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
            
            // 💡「第1希望順 → 第2希望順」の辞書式ソート
            const dataRows = allRows.slice(1)
                .filter(row => row[0]) 
                .sort((a, b) => {
                    const firstA = Number(a[1]) || 0;
                    const firstB = Number(b[1]) || 0;
                    const secondA = Number(a[2]) || 0;
                    const secondB = Number(b[2]) || 0;
                    
                    if (firstB !== firstA) {
                        return firstB - firstA;
                    }
                    return secondB - secondA;
                });

            // 💡 質問2のフォーム用のボタン生成
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

            window.zemiDataRows = dataRows;
            renderZemiPage(1);

        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = '<p style="text-align: center; color: #8C1C28;">データの読み込みに失敗しました。</p>';
        });
});

// 💡 指定したページ番号のゼミ一覧を描画する関数（ライトモード＆#8C1C28対応）
window.renderZemiPage = function(page) {
    const container = document.getElementById('zemi-results-container');
    if (!container || !window.zemiDataRows) return;

    const itemsPerPage = 10;
    const totalPages = Math.ceil(window.zemiDataRows.length / itemsPerPage) || 1;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = window.zemiDataRows.slice(startIndex, endIndex);

    if (window.zemiDataRows.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #555555;">現在、希望分野はまだありません。</p>';
        return;
    }

    let html = '';
    let paginationHtml = '';

    // 💡 ページネーション（前へ・次へボタン）の生成（テーマカラー #8C1C28 対応）
    if (totalPages > 1) {
        paginationHtml += '<div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 1.5rem;">';
        
        if (page > 1) {
            paginationHtml += `<button onclick="renderZemiPage(${page - 1})" style="background: #8C1C28; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">&lt; 前へ</button>`;
        } else {
            paginationHtml += `<button style="background: #e0d5d5; color: #888; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>&lt; 前へ</button>`;
        }

        paginationHtml += `<span style="color: #222222; font-weight: bold; font-size: 1.1rem;">${page} / ${totalPages}</span>`;

        if (page < totalPages) {
            paginationHtml += `<button onclick="renderZemiPage(${page + 1})" style="background: #8C1C28; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">次へ &gt;</button>`;
        } else {
            paginationHtml += `<button style="background: #e0d5d5; color: #888; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>次へ &gt;</button>`;
        }

        paginationHtml += '</div>';
        html += paginationHtml;
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

        // 💡 カード枠線とバッジ色の設定（ライトモード仕様）
        let borderColor = '#d4caca'; 
        let badgeHtml = '';

        if (first >= 4) {
            borderColor = '#8C1C28'; // 班成立：テーマカラーのワインレッド
            badgeHtml = '<span style="background: #8C1C28; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">班成立！</span>';
        } else if (first >= 3) {
            borderColor = '#d97706'; // もう少し！：白背景でも映える落ち着いたアンバーゴールド
            badgeHtml = '<span style="background: #d97706; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">もう少し！</span>';
        }

        html += `
        <div class="zemi-card-sp" style="background: #ffffff; border: 2px solid ${borderColor}; border-radius: 8px; padding: 1rem; height: 100%; box-sizing: border-box; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <h3 style="margin: 0 0 0.8rem 0; font-size: 1.1rem; color: #222222;">
                ${fieldName} ${badgeHtml}
            </h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem;">
                <span style="background: rgba(140, 28, 40, 0.12); color: #8C1C28; border: 1px solid rgba(140, 28, 40, 0.3); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">第1希望: ${first}人</span>
                <span style="background: #f0ecec; color: #444444; border: 1px solid #d4caca; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">第2希望: ${second}人</span>
            </div>
            <details style="background: #FCF6F6; border: 1px solid #e6dada; padding: 0.5rem; border-radius: 4px;">
                <summary style="cursor: pointer; font-weight: bold; color: #333333; font-size: 0.9rem; outline: none;">概要を見る</summary>
                <p style="margin-top: 0.5rem; margin-bottom: 0; color: #444444; font-size: 0.85rem; line-height: 1.5;">
                    ${description.replace(/\n/g, '<br>')}
                </p>
            </details>
        </div>`;
    });

    html += '</div>';

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

// ゼミ班アコーディオン
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

let isKibou1Proposal = false;
let isKibou2Proposal = false;

document.addEventListener("DOMContentLoaded", () => {
  const inputBunya = document.getElementById("input-bunya");
  if (inputBunya) {
    inputBunya.addEventListener("input", updateProposalButton);
  }

  const btnMyProposal = document.getElementById("btn-my-proposal");
  if (btnMyProposal) {
    btnMyProposal.removeAttribute("onclick");
    btnMyProposal.addEventListener("click", () => {
      const val = document.getElementById("input-bunya").value.trim();
      selectField(val, true);
    });
  }

  const requiredIds = ["input-kyomi", "input-x", "input-route", "input-route-other"];
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", checkRequiredFields);
      el.addEventListener("input", checkRequiredFields);
    }
  });

  checkRequiredFields();
});

function checkRequiredFields() {
  const kyomi = document.getElementById("input-kyomi") ? document.getElementById("input-kyomi").value.trim() : "";
  const xSend = document.getElementById("input-x") ? document.getElementById("input-x").value.trim() : "";
  const route = document.getElementById("input-route") ? document.getElementById("input-route").value.trim() : "";
  
  let isValid = true;
  
  if (kyomi === "") isValid = false;
  if (xSend === "") isValid = false;
  if (route === "") isValid = false;

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

function selectField(fieldName, isProposal = false) {
  if (!fieldName || fieldName.trim() === "") return;
  fieldName = fieldName.trim();

  if (!kibou1) {
    kibou1 = fieldName;
    isKibou1Proposal = isProposal;
  } else if (!kibou2 && kibou1 !== fieldName) {
    kibou2 = fieldName;
    isKibou2Proposal = isProposal;
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
    isKibou1Proposal = false;
  }
  if (num === 2) {
    kibou2 = "";
    isKibou2Proposal = false;
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

  let targetUrl = "https://docs.google.com/forms/d/e/1FAIpQLSc1c_nhPMIGUI0cu3LWzOjzSo6dVhDmn-MGO1FgJJ-fh7Vitg/viewform?usp=pp_url&entry.669942318=DUMMY_BUNYA&entry.930125208=DUMMY_GENRE&entry.2097477009=DUMMY_GAIYOU&entry.1542851026=DUMMY_KIBOU1&entry.45651459=DUMMY_KIBOU2&entry.45918589=DUMMY_KYOMI&entry.1192163566=DUMMY_X&entry.2036668219=DUMMY_XDETAIL&entry.375378926=DUMMY_ROUTE&entry.405628407=DUMMY_FREE";

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
