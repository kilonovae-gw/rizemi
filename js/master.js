const responsive_menu_btn = document.querySelector('.responsive_btn');

// 💡 レスポンシブ用ハンバーガーメニューボタンのクリックイベント登録
if (responsive_menu_btn) {
  responsive_menu_btn.addEventListener('click', menuToggle);
}

// 💡 スマホ版・PC版ナビゲーションメニューの開閉（トグル）を行う関数
function menuToggle() {
  const pcMenu = document.querySelector('.main-nav');
  const spMenu = document.querySelector('.main-nav-sp');

  if (pcMenu) pcMenu.classList.toggle('menu_active');
  if (spMenu) spMenu.classList.toggle('menu_active');
  responsive_menu_btn.classList.toggle('active');
}

// 💡 スプレッドシートのセル値（全角数字・半角数字・空白等）から安全に数値（人数）を抽出するヘルパー関数
function parseCount(val) {
  if (val === null || val === undefined) return 0;
  // 1. 全角数字（０-９）を半角数字（0-9）に変換
  let str = String(val).replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  // 2. 数字以外の記号、文字、空白・改行コード等をすべて除去
  str = str.replace(/[^0-9]/g, '');
  // 3. 数値（10進数）へ変換（空文字や変換不能時は0を返す）
  return parseInt(str, 10) || 0;
}

document.addEventListener('DOMContentLoaded', () => {

    // 💡 Googleスプレッドシート（Sheet2）の公開用CSV出力URL
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwd-NfW52i7COyA23A_pbCIR6M-ZN8zpMdV4iW299l1NwR2VMnVKS8Ri1grVMkyLHtaRadoeJaRIfo/pub?gid=453089662&single=true&output=csv';

    // 💡 ゼミカード一覧を描画するコンテナ要素を取得
    const container = document.getElementById('zemi-results-container');
    if(!container) return; // 該当要素が存在しないページでは以降の処理を行わない

    // 💡 データ読み込み中の初期表示メッセージ
    container.innerHTML = '<p style="text-align: center; color: #cecece;">現在の希望状況を読み込んでいます...</p>';

    // 💡 質問2のフォーム内にある各ジャンル別アコーディオンのボタン追加エリアを取得
    const areaPhysics = document.getElementById('area-physics');
    const areaMath = document.getElementById('area-math');
    const areaChemBio = document.getElementById('area-chem-bio'); 
    const areaOther = document.getElementById('area-other');

    // 💡 各アコーディオンエリアを一度初期化（空にする）
    if (areaPhysics) areaPhysics.innerHTML = '';
    if (areaMath) areaMath.innerHTML = '';
    if (areaChemBio) areaChemBio.innerHTML = ''; 
    if (areaOther) areaOther.innerHTML = '';

    // 💡 CSVデータを取得・パースする処理
    fetch(sheetUrl)
        .then(response => response.text())
        .then(csvText => {
            const allRows = parseCSV(csvText); // CSV文字列を2次元配列に変換
            
            // 💡【データの抽出（フィルタリング）および並び替え（ソート）処理】
            const dataRows = allRows.slice(1) // 1行目（ヘッダー行）を除外
                .filter(row => {
                    // ① A列（row[0]）が存在し、空欄でないことを確認（送信履歴のある行のみ抽出）
                    const hasTimestamp = row[0] && row[0].trim() !== '';
                    
                    // ② C列（row[2]）に分野名が入っていることを確認（既存分野への人数加算のみで提案分野名が空の行は除外）
                    const hasFieldName = row[2] && row[2].trim() !== '';

                    return hasTimestamp && hasFieldName;
                }) 
                .sort((a, b) => {
                    // 💡 F列(row[5]: 第1希望) と G列(row[6]: 第2希望) の人数を取得（parseCountで数値化）
                    const firstA = parseCount(a[5]);
                    const firstB = parseCount(b[5]);
                    const secondA = parseCount(a[6]);
                    const secondB = parseCount(b[6]);
                    
                    // 第1希望の人数が多い順（降順）に並び替え
                    if (firstB !== firstA) {
                        return firstB - firstA; 
                    }
                    // 第1希望が同数の場合は、第2希望の人数が多い順に並び替え
                    return secondB - secondA;   
                });

            // 💡【質問2：アコーディオン内の分野選択ボタンを一括生成】
            dataRows.forEach(row => {
                const fieldName = row[2].trim(); // C列：分野名
                const tagsField = row[3] || '';  // D列：ジャンル（タグ）
                const btnHtml = `<button type="button" class="field-btn" onclick="selectField('${fieldName}')">${fieldName}</button> `;
                
                let hasMainTag = false; 

                // D列のタグ文字列（物理・数学・化学・生物など）に応じて、該当アコーディオンへ選択ボタンを挿入
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
                // 特定タグにヒットしない場合や「その他」の場合は「その他」アコーディオンへ配置
                if ((tagsField.includes('その他') || !hasMainTag) && areaOther) {
                    areaOther.insertAdjacentHTML('beforeend', btnHtml);
                }
            });

            // 💡 抽出・並び替え済みのデータをグローバル変数に保存し、1ページ目を描画
            window.zemiDataRows = dataRows;
            renderZemiPage(1);

        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = '<p style="text-align: center; color: #cecece;">データの読み込みに失敗しました。</p>';
        });
});

// 💡 指定したページ番号のゼミ一覧カードを描画する関数
window.renderZemiPage = function(page) {
    const container = document.getElementById('zemi-results-container');
    if (!container || !window.zemiDataRows) return;

    const itemsPerPage = 10; // 💡 1ページあたりの表示カード数（10件）
    const totalPages = Math.ceil(window.zemiDataRows.length / itemsPerPage) || 1;

    // 💡 ページ番号が範囲外（1未満や最大ページ超え）にならないよう補正
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = window.zemiDataRows.slice(startIndex, endIndex); // 現在のページに表示する分のみ切り出し

    if (window.zemiDataRows.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #cecece;">現在、希望分野はまだありません。</p>';
        return;
    }

    let html = '';
    let paginationHtml = ''; 

    // 💡【ページネーション（前へ・次へボタン）のHTML生成】
    if (totalPages > 1) {
        paginationHtml += '<div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 1.5rem;">';
        
        // 前へボタン
        if (page > 1) {
            paginationHtml += `<button onclick="renderZemiPage(${page - 1})" style="background: #555; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">&lt; 前へ</button>`;
        } else {
            paginationHtml += `<button style="background: #333; color: #777; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>&lt; 前へ</button>`;
        }

        // 現在のページ番号 / 全ページ数
        paginationHtml += `<span style="color: #cecece; font-weight: bold; font-size: 1.1rem;">${page} / ${totalPages}</span>`;

        // 次へボタン
        if (page < totalPages) {
            paginationHtml += `<button onclick="renderZemiPage(${page + 1})" style="background: #555; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.95rem;">次へ &gt;</button>`;
        } else {
            paginationHtml += `<button style="background: #333; color: #777; border: none; padding: 8px 16px; border-radius: 4px; cursor: not-allowed; font-weight: bold; font-size: 0.95rem;" disabled>次へ &gt;</button>`;
        }

        paginationHtml += '</div>';
        html += paginationHtml; // カード一覧の上部にページネーションを追加
    }

    html += '<div class="zemi-grid-container">';

    // 💡【各ゼミカードのHTML生成】
    pageData.forEach(row => {
        const fieldName = row[2] ? row[2].trim() : ''; // C列：分野名
        
        // F列(row[5])：第1希望人数, G列(row[6])：第2希望人数 をparseCount関数で安全に取得
        const first = parseCount(row[5]);
        const second = parseCount(row[6]);
        
        // E列(row[4])：概要（未入力時やエラー表記時はデフォルトテキスト）
        let description = (row[4] || '').trim();
        if (description === '' || description === '#N/A') {
            description = '概要はまだありません。';
        }

        // 第1希望人数に応じた枠線カラーおよびバッジ表示の設定
        let borderColor = '#555'; 
        let badgeHtml = '';

        if (first >= 4) {
            borderColor = '#ff6b6b'; 
            badgeHtml = '<span style="background: #ff6b6b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">班成立！</span>';
        } else if (first >= 3) {
            borderColor = '#91b825'; 
            badgeHtml = '<span style="background: #91b825; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; margin-left: 0.5rem;">もう少し！</span>';
        }

        // ゼミカード1件分のHTML文字列組み立て
        html += `
        <div class="zemi-card-sp" style="background: rgba(255,255,255,0.05); border: 2px solid ${borderColor}; border-radius: 8px; padding: 1rem; height: 100%; box-sizing: border-box;">
            <h3 style="margin: 0 0 0.8rem 0; font-size: 1.1rem; color: #fff;">
                ${fieldName} ${badgeHtml}
            </h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem;">
                <!-- 希望人数の表示部分 -->
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

    html += '</div>'; // グリッド描画の終了

    // カード一覧の下部にもページネーションを挿入
    if (totalPages > 1) {
        html += paginationHtml.replace('margin-bottom: 1.5rem;', 'margin-top: 1.5rem; margin-bottom: 0;');
    }

    container.innerHTML = html;
};

// 💡 CSV文字列をクォート考慮で2次元配列へ分解するパース関数
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

// 💡 汎用アコーディオン（開閉メニュー）制御関数
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
// 💡 選択された第1希望・第2希望の分野名を保持する変数
let kibou1 = "";
let kibou2 = "";

// 💡 質問1で入力・提案した分野が、第1希望/第2希望として選択されているかを管理するフラグ
let isKibou1Proposal = false;
let isKibou2Proposal = false;

document.addEventListener("DOMContentLoaded", () => {
  // 💡 提案分野名の入力欄に文字が入るたび、ボタン表示および選択内容をリアルタイム更新
  const inputBunya = document.getElementById("input-bunya");
  if (inputBunya) {
    inputBunya.addEventListener("input", updateProposalButton);
  }

  // 💡 「自分が提案した分野を選ぶ」ボタンクリック時の処理設定
  const btnMyProposal = document.getElementById("btn-my-proposal");
  if (btnMyProposal) {
    btnMyProposal.removeAttribute("onclick");
    btnMyProposal.addEventListener("click", () => {
      const val = document.getElementById("input-bunya").value.trim();
      selectField(val, true); // true = 自分が提案した分野経由での選択であることを記録
    });
  }

  // 💡 送信に必要な必須項目の変化をリアルタイム監視
  const requiredIds = ["input-kyomi", "input-x", "input-route", "input-route-other"];
  requiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", checkRequiredFields);
      el.addEventListener("input", checkRequiredFields);
    }
  });

  // 💡 初期状態（必須項目が埋まるまで送信ボタンを無効化）の適用
  checkRequiredFields();
});

// 💡 必須項目がすべて入力されているかチェックし、送信ボタンの有効化/無効化を切り替える関数
function checkRequiredFields() {
  const kyomi = document.getElementById("input-kyomi") ? document.getElementById("input-kyomi").value.trim() : "";
  const xSend = document.getElementById("input-x") ? document.getElementById("input-x").value.trim() : "";
  const route = document.getElementById("input-route") ? document.getElementById("input-route").value.trim() : "";
  
  let isValid = true;
  
  // 未選択の必須項目があれば送信不可にする
  if (kyomi === "") isValid = false;
  if (xSend === "") isValid = false;
  if (route === "") isValid = false;

  // 「その他」を選んでいる場合、詳細入力が空なら送信不可にする
  if (route === "その他") {
      const routeOther = document.getElementById("input-route-other") ? document.getElementById("input-route-other").value.trim() : "";
      if (routeOther === "") isValid = false;
  }

  // 条件を満たしていれば送信ボタンを有効化
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

// 💡 質問1の文字入力に応じて、「自分が提案した分野を選ぶ」ボタンテキストや選択状況を連動更新する関数
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

  // 提案入力欄を変更した際、既に自分の提案分野が選択中なら選択テキストを連動更新
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

// 💡 分野ボタンクリック時に第1希望・第2希望へ割り振る関数
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

// 💡 選択した希望分野を解除する関数
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

// 💡 選択状況確認ボックス（第1希望・第2希望）のテキスト表示更新関数
function updateDisplay() {
  const disp1 = document.getElementById("disp-kibou1");
  const disp2 = document.getElementById("disp-kibou2");
  if (disp1) disp1.innerText = kibou1 || "未選択";
  if (disp2) disp2.innerText = kibou2 || "未選択";
}

// 💡 Xでの宣伝で「宣伝する」選択時に詳細テキストエリアを表示させる関数
function toggleXDetail() {
  const xVal = document.getElementById("input-x").value;
  const detailBox = document.getElementById("x-detail-box");
  if (detailBox) detailBox.style.display = (xVal === "宣伝する" || xVal === "はい（呼び掛けを希望する）") ? "block" : "none";
  checkRequiredFields(); 
}

// 💡 知ったきっかけで「その他」選択時に詳細入力欄を表示させる関数
function toggleRouteOther() {
  const routeVal = document.getElementById("input-route").value;
  const routeOther = document.getElementById("input-route-other");
  if (routeOther) routeOther.style.display = (routeVal === "その他") ? "block" : "none";
  checkRequiredFields(); 
}

// 💡 入力内容をGoogleフォームのPrefill URL（事前入力パラメータ）に組み込んで新タブで開く関数
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

  // 💡 送信先GoogleフォームのURL（事前入力用エントリーキー含む）
  let targetUrl = "https://docs.google.com/forms/d/e/1FAIpQLSc1c_nhPMIGUI0cu3LWzOjzSo6dVhDmn-MGO1FgJJ-fh7Vitg/viewform?usp=pp_url&entry.669942318=+DUMMY_BUNYA&entry.930125208=+DUMMY_GENRE&entry.2097477009=+DUMMY_GAIYOU&entry.1542851026=+DUMMY_KIBOU1&entry.45651459=+DUMMY_KIBOU2&entry.45918589=+DUMMY_KYOMI&entry.1192163566=+DUMMY_X&entry.2036668219=+DUMMY_XDETAIL&entry.375378926=+DUMMY_ROUTE&entry.405628407=+DUMMY_FREE";

  // 💡 各ダミー文字列を入力データ（URLエンコード適用）へ置換
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

  // 別タブでフォームを開く
  window.open(targetUrl, "_blank");
}

// 💡 フォーム展開ボタンクリック時に非表示エリアを表示しスムーズスクロールする関数
function showProposalForm() {
  const formArea = document.getElementById("proposal-form-area");
  if (formArea) {
    formArea.style.display = "block";
    formArea.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
