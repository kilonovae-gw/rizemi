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

// スライドショーの初期化（スワイプ・ドラッグ対応）
$(document).ready(function(){
  $('.your-class').slick({
    swipe: true,         // タッチスワイプを有効化
    swipeToSlide: true,  // 指で動かした分だけ滑らかにスライド
    touchMove: true,     // タッチによるスクロール移動を許可
    draggable: true,     // PCのマウスドラッグ操作も許可
    autoplay: true,      // 自動再生（必要に応じて）
    autoplaySpeed: 3000, // スライド切り替え速度（ミリ秒）
    arrows: false,       // 矢印ボタンの表示/非表示
    dots: true           // 下部のドットナビゲーション（必要に応じて）
  });
});
