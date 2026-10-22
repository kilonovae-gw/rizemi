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
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXJJ0GtKGzjHujGOprGAW4Yl1StEtNqI-amqHIHvzfzsMcqqMsY0H25lMNmF6tLhv7YJzJb44CD1hp/pub?gid=1890726541&single=true&output=csv';

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

