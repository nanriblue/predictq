// 「다음엔?」 목업 렌더링 로직
// ARTICLES(data.js)를 받아 선택된 기사를 다음 기사뷰 + 하단 「다음엔?」 흐름 카드로 그린다.
// 화면 카피는 "예측" 대신 전망·흐름·관전포인트 중심. 확률은 자연어 전망 뒤에 보조로 노출.

(function () {
  const articleEl = document.getElementById("article");
  const switcherBtns = document.querySelectorAll(".switcher__btn");

  // 숫자에 천 단위 콤마
  const fmt = (n) => n.toLocaleString("ko-KR");

  // AI 전망 수치 → 색상 톤(우세/팽팽/우려)
  function flowClass(p) {
    if (p >= 60) return "is-high";
    if (p >= 45) return "is-mid";
    return "is-low";
  }

  // 민감 이슈 디스클레이머 박스
  function renderDisclaimer(f) {
    if (!f.sensitive) return "";
    return `
      <div class="flowc__disc">
        <span class="flowc__disc-tag">⚠ 표현 주의 · 민감 이슈</span>
        <ul>${f.disclaimers.map((t) => `<li>${t}</li>`).join("")}</ul>
      </div>`;
  }

  // 다음 체크포인트(관전 포인트) 칩
  function renderCheckpoints(items) {
    return items.map((t) => `<span class="flowc__chip">${t}</span>`).join("");
  }

  // 독자 전망(구조화된 선택형 참여) 막대
  function renderPoll(r) {
    const max = Math.max(...r.options.map((o) => o.pct));
    const rows = r.options
      .map((o) => {
        const lead = o.pct === max ? "is-lead" : "";
        return `
        <div class="poll__row">
          <span class="poll__name">${o.label}</span>
          <div class="poll__track"><span class="poll__fill ${lead}" data-w="${o.pct}"></span></div>
          <b class="poll__pct">${o.pct}%</b>
        </div>`;
      })
      .join("");
    return `
      <div class="flowc__poll">
        <h4>독자 전망</h4>
        <p class="poll__sent">${r.sentence}</p>
        ${rows}
        <p class="poll__total">총 ${fmt(r.total)}명 참여</p>
      </div>`;
  }

  // 흐름 업데이트(텍스트 타임라인)
  function renderUpdates(updates) {
    const items = updates
      .map(
        (u) => `
        <div class="upd">
          <span class="upd__time">${u.time}</span>
          <p class="upd__text">${u.text}</p>
        </div>`
      )
      .join("");
    return `<div class="flowc__updates"><h4>흐름 업데이트</h4>${items}</div>`;
  }

  // 이 흐름 더 보기(관련 흐름)
  function renderRelated(related) {
    const items = related
      .map(
        (r) => `
        <a class="rel">
          <span class="rel__tag">${r.tag}</span>
          <span class="rel__text">${r.text}</span>
        </a>`
      )
      .join("");
    return `<div class="flowc__related"><h4>이 흐름 더 보기</h4>${items}</div>`;
  }

  function renderFlow(f) {
    const cls = flowClass(f.aiOutlook);
    return `
      <section class="flowc tone--${f.tone}">
        <div class="flowc__head">
          <span class="flowc__logo">다음엔?</span>
          <span class="flowc__tag">이 이슈의 다음 흐름</span>
        </div>

        <h3 class="flowc__q">${f.question}</h3>

        <div class="flowc__current ${cls}">
          <span class="flowc__dot"></span>
          <div class="flowc__current-body">
            <span class="flowc__current-lab">현재 흐름</span>
            <p class="flowc__current-txt">${f.current}</p>
          </div>
          <span class="flowc__ai">AI 전망 <b>${f.aiOutlook}%</b></span>
        </div>

        ${renderDisclaimer(f)}

        <div class="flowc__view">
          <div class="flowc__view-row is-pro">
            <span class="flowc__view-lab">${f.proLabel}</span>
            <p>${f.pro}</p>
          </div>
          <div class="flowc__view-row is-con">
            <span class="flowc__view-lab">${f.conLabel}</span>
            <p>${f.con}</p>
          </div>
        </div>

        <div class="flowc__check">
          <h4>다음 체크포인트</h4>
          <div class="flowc__chips">${renderCheckpoints(f.checkpoints)}</div>
        </div>

        ${renderPoll(f.reader)}
        ${renderUpdates(f.updates)}
        ${renderRelated(f.related)}

        <div class="flowc__cta">
          ${f.cta.map((c, i) => `<button class="cta ${i === 0 ? "cta--primary" : ""}">${c}</button>`).join("")}
        </div>

        <p class="flowc__note">${f.note} · 업데이트 ${f.updatedAgo}</p>
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
        <span class="handoff__txt">이 기사, 다음엔 어떻게 될까요?</span>
        <span class="handoff__line"></span>
      </div>

      ${renderFlow(a.flow)}
    `;

    // 막대 채우기 애니메이션 (렌더 직후 다음 프레임에서 width 적용)
    requestAnimationFrame(() => {
      articleEl.querySelectorAll(".poll__fill").forEach((el) => {
        el.style.width = el.dataset.w + "%";
      });
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
