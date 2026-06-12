// 「다음엔?」 목업 렌더링 로직
// ARTICLES(data.js)를 받아 선택된 기사를 기사뷰 + 예측 카드로 그린다.

(function () {
  const articleEl = document.getElementById("article");
  const switcherBtns = document.querySelectorAll(".switcher__btn");

  // 숫자에 천 단위 콤마
  const fmt = (n) => n.toLocaleString("ko-KR");

  // 리스트 항목들을 <li> 문자열로
  const listItems = (arr) => arr.map((t) => `<li>${t}</li>`).join("");

  // 예측 확률 → 색상 톤(높음/중간/낮음)을 막대 색으로 표현
  function probClass(p) {
    if (p >= 60) return "is-high";
    if (p >= 45) return "is-mid";
    return "is-low";
  }

  // 업데이트 로그(작은 추이 그래프)를 막대들로
  function renderLog(log) {
    const max = 100;
    const bars = log
      .map((d, i) => {
        const h = Math.max(8, (d.value / max) * 100);
        const last = i === log.length - 1;
        return `
          <div class="logbar ${last ? "is-now" : ""}">
            <span class="logbar__val">${d.value}%</span>
            <span class="logbar__fill" style="height:${h}%"></span>
            <span class="logbar__date">${d.date}</span>
          </div>`;
      })
      .join("");
    return `<div class="predict__log">${bars}</div>`;
  }

  // 민감 이슈 디스클레이머 박스
  function renderDisclaimer(d) {
    if (!d.sensitive) return "";
    return `
      <div class="predict__disclaimer">
        <span class="predict__disclaimer-tag">⚠ 표현 주의 · 민감 이슈</span>
        <ul>${listItems(d.disclaimers)}</ul>
      </div>`;
  }

  function renderPredict(p) {
    return `
      <section class="predict tone--${p.tone}">
        <div class="predict__head">
          <span class="predict__logo">다음엔?</span>
          <span class="predict__tag">기사 이후의 궁금증 예측</span>
        </div>

        <h3 class="predict__q">${p.question}</h3>

        <div class="predict__gauge">
          <div class="predict__num ${probClass(p.probability)}">
            <strong>${p.probability}</strong><span>%</span>
          </div>
          <div class="predict__bar">
            <span class="predict__label">${p.label}</span>
            <div class="predict__track">
              <div class="predict__fill ${probClass(p.probability)}" data-w="${p.probability}"></div>
            </div>
            <span class="predict__updated">현재 공개 정보 기준 · 업데이트 ${p.updatedAgo}</span>
          </div>
        </div>

        ${renderDisclaimer(p)}

        <div class="predict__grid">
          <div class="predict__col predict__col--ground">
            <h4>📈 근거</h4>
            <ul>${listItems(p.grounds)}</ul>
          </div>
          <div class="predict__col predict__col--var">
            <h4>🎯 핵심 변수</h4>
            <ul>${listItems(p.variables)}</ul>
          </div>
        </div>

        <div class="predict__counter">
          <h4>↔ 반대 근거</h4>
          <ul>${listItems(p.counter)}</ul>
        </div>

        <div class="predict__logwrap">
          <h4>예측 업데이트 로그</h4>
          ${renderLog(p.log)}
        </div>

        <div class="predict__cta">
          ${p.cta.map((c, i) => `<button class="cta ${i === 0 ? "cta--primary" : ""}">${c}</button>`).join("")}
        </div>

        <p class="predict__note">${p.note}</p>
      </section>`;
  }

  // 다음 기사뷰의 표정(감정) 리액션 바
  function renderEmotions(emotions) {
    return `<div class="article__reactions">${emotions
      .map(
        (e) => `
        <button class="emo">
          <span class="emo__face">${e.emoji}</span>
          <span class="emo__label">${e.label}</span>
          <span class="emo__count">${fmt(e.count)}</span>
        </button>`
      )
      .join("")}</div>`;
  }

  function renderArticle(a) {
    articleEl.innerHTML = `
      <div class="article__press">
        <span class="press__logo ${a.categoryClass}">${a.press.charAt(0)}</span>
        <span class="press__name">${a.press}</span>
        <button class="press__sub">+ 구독</button>
      </div>
      <span class="article__cat ${a.categoryClass}">${a.category}</span>
      <h2 class="article__title">${a.title}</h2>
      <div class="article__meta">
        <span>${a.reporter}</span><span>·</span><span>입력 ${a.date}</span>
      </div>
      <div class="article__photo">📷 기사 이미지</div>
      ${a.body.map((p) => `<p class="article__p">${p}</p>`).join("")}

      ${renderEmotions(a.emotions)}

      <div class="article__commentbar">
        <span><b>💬 댓글</b> ${fmt(a.comment)}</span>
        <span class="article__commentbar-icons">🔗 공유 · Aa 글씨</span>
      </div>

      <div class="handoff">
        <span class="handoff__line"></span>
        <span class="handoff__txt">이 이슈, 다음엔 어떻게 될까요?</span>
        <span class="handoff__line"></span>
      </div>

      ${renderPredict(a.predict)}
    `;

    // 막대 채우기 애니메이션 (렌더 직후 다음 프레임에서 width 적용)
    requestAnimationFrame(() => {
      const fill = articleEl.querySelector(".predict__fill");
      if (fill) fill.style.width = fill.dataset.w + "%";
    });
  }

  // 탭 전환
  switcherBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switcherBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderArticle(ARTICLES[Number(btn.dataset.index)]);
      articleEl.scrollTop = 0;
    });
  });

  // 첫 화면
  renderArticle(ARTICLES[0]);
})();
