// 「다음엔?」 목업 렌더링 로직
// 다음 기사뷰 + 하단 2지선다 흐름 카드. AI 전망 / 내 투표 / 독자 전망(투표 후 공개) /
// 좋게 볼 점·걸리는 점·체크포인트·커뮤니티·흐름 업데이트(접기) / 결과 정산(토글).

(function () {
  const articleEl = document.getElementById("article");
  const switcherBtns = document.querySelectorAll(".switcher__btn");

  const fmt = (n) => n.toLocaleString("ko-KR");

  // 2지선다 분할 막대 (높은 쪽이 강조색). animate=true면 width 0에서 채움.
  function splitBar(options, animate) {
    const lead = options[0].pct >= options[1].pct ? 0 : 1;
    return `<div class="dn__split">${options
      .map(
        (o, i) =>
          `<div class="dn__seg ${i === lead ? "is-lead" : ""}" style="${
            animate ? "width:0" : "width:" + o.pct + "%"
          }" data-w="${o.pct}"><span>${o.label}</span><b>${o.pct}%</b></div>`
      )
      .join("")}</div>`;
  }

  // 결과 정산 패널 (resolved가 있으면 결과, 없으면 진행 중 안내)
  function resolvedPanel(f) {
    if (!f.resolved) {
      return `
        <div class="dn__resolved">
          <div class="dn__resolved-badge dn__resolved-badge--wait">⏳ 아직 결과가 확정되지 않았어요</div>
          <p class="dn__resolved-msg">선고·발표 등 결과가 확인되면 이 자리에서 전망 결과를 알려드려요.</p>
        </div>`;
    }
    const r = f.resolved;
    return `
      <div class="dn__resolved">
        <div class="dn__resolved-badge">🏁 전망 결과가 나왔어요</div>
        <p class="dn__resolved-outcome">${r.outcome}</p>
        <ul class="dn__resolved-list">
          <li><span>AI 전망</span><b>${r.ai}</b></li>
          <li><span>독자 전망</span><b>${r.reader}</b></li>
          <li><span>내 전망</span><b>${r.my}</b></li>
        </ul>
        <div class="dn__resolved-result ${r.hit ? "is-hit" : "is-miss"}">
          결과: ${r.hit ? "적중 🎯" : "빗나감"}
        </div>
      </div>`;
  }

  function renderFlow(f) {
    return `
      <section class="dn tone--${f.tone}">
        <div class="dn__head">
          <span class="dn__logo">다음엔?</span>
          <span class="dn__tag">이 이슈의 다음 흐름</span>
          <button class="dn__settle" type="button">전망 결과 보기</button>
        </div>

        <h3 class="dn__q">${f.question}</h3>

        <div class="dn__live">
          <!-- AI 전망 -->
          <div class="dn__ai">
            <div class="dn__ai-top">
              <span class="dn__ai-lab">AI 전망</span>
              <span class="dn__ai-sub">현재 공개 정보 기준</span>
            </div>
            <p class="dn__ai-sent">${f.aiSentence}</p>
            ${splitBar(f.ai, false)}
          </div>

          <!-- 내 전망 남기기 -->
          <div class="dn__vote">
            <span class="dn__vote-lab">내 전망 남기기 · 당신의 전망은?</span>
            <div class="dn__vote-btns">
              ${f.ai
                .map((o) => `<button class="vbtn" type="button" data-opt="${o.label}">${o.label}</button>`)
                .join("")}
            </div>
          </div>

          <!-- 독자 전망 (투표 후 공개) -->
          <div class="dn__reader is-locked">
            <div class="dn__reader-lock">🔒 투표하면 독자 전망을 볼 수 있어요</div>
            <div class="dn__reader-body">
              <div class="dn__reader-head"><span>독자 전망</span><em>총 ${fmt(
                f.reader.total
              )}명 참여</em></div>
              ${splitBar(f.reader.options, true)}
              <p class="dn__mypick">내 전망 <b>—</b></p>
            </div>
          </div>

          <!-- CTA -->
          <div class="dn__cta">
            ${f.cta
              .map((c, i) => `<button class="cta ${i === 0 ? "cta--primary" : ""}" type="button">${c}</button>`)
              .join("")}
          </div>

          <!-- 자세히 보기 (접기) -->
          <button class="dn__more" type="button">자세히 보기 <span class="dn__more-caret">▾</span></button>
          <div class="dn__detail">
            <div class="dn__view">
              <div class="dn__view-row is-pro">
                <span class="dn__view-lab">${f.proLabel}</span>
                <p>${f.pro}</p>
              </div>
              <div class="dn__view-row is-con">
                <span class="dn__view-lab">${f.conLabel}</span>
                <p>${f.con}</p>
              </div>
            </div>

            <div class="dn__check">
              <h4>다음 체크포인트</h4>
              <div class="dn__chips">${f.checkpoints
                .map((c) => `<span class="dn__chip">${c}</span>`)
                .join("")}</div>
            </div>

            <div class="dn__community">
              <h4>커뮤니티 의견</h4>
              <div class="dn__comm-card">
                <span class="dn__comm-brand">다음 커뮤니티</span>
                <p class="dn__comm-title">${f.community.title}</p>
                <p class="dn__comm-desc">${f.community.desc}</p>
                <div class="dn__comm-btns">
                  <button class="cta cta--primary" type="button">의견 쓰기</button>
                  <button class="cta" type="button">토론 보기</button>
                </div>
              </div>
            </div>

            <div class="dn__updates">
              <h4>흐름 업데이트</h4>
              ${f.updates
                .map(
                  (u) => `<div class="dn__upd"><span class="dn__upd-time">${u.time}</span><p>${u.text}</p></div>`
                )
                .join("")}
            </div>
          </div>
        </div>

        ${resolvedPanel(f)}

        <p class="dn__note">${f.note} · 업데이트 ${f.updatedAgo}</p>
      </section>`;
  }

  // 표정(감정) 리액션 바 (다음 기사뷰)
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

  // 카드 내부 인터랙션 바인딩 (투표 / 접기 / 결과 정산)
  function bindCard() {
    const card = articleEl.querySelector(".dn");
    if (!card) return;

    // 투표 → 버튼 활성화 + 독자 전망 공개
    card.querySelectorAll(".vbtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        card.querySelectorAll(".vbtn").forEach((b) => {
          b.classList.remove("is-picked");
          b.disabled = true;
        });
        btn.classList.add("is-picked");
        const my = card.querySelector(".dn__mypick b");
        if (my) my.textContent = btn.dataset.opt;
        const reader = card.querySelector(".dn__reader");
        reader.classList.remove("is-locked");
        requestAnimationFrame(() => {
          reader.querySelectorAll(".dn__seg").forEach((s) => {
            s.style.width = s.dataset.w + "%";
          });
        });
      });
    });

    // 자세히 보기 접기/펼치기
    const more = card.querySelector(".dn__more");
    const detail = card.querySelector(".dn__detail");
    more.addEventListener("click", () => {
      const open = detail.classList.toggle("is-open");
      more.querySelector(".dn__more-caret").textContent = open ? "▴" : "▾";
      more.firstChild.textContent = open ? "접기 " : "자세히 보기 ";
    });

    // 결과 정산 미리보기 토글
    const settle = card.querySelector(".dn__settle");
    settle.addEventListener("click", () => {
      const on = card.classList.toggle("show-resolved");
      settle.textContent = on ? "← 전망 카드로" : "전망 결과 보기";
    });
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
      <p class="handoff__sub">AI 전망과 독자 의견을 함께 보고, 결과가 바뀌면 다시 알려드려요.</p>

      ${renderFlow(a.flow)}
    `;
    bindCard();
  }

  switcherBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switcherBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderArticle(ARTICLES[Number(btn.dataset.index)]);
      articleEl.scrollTop = 0;
    });
  });

  renderArticle(ARTICLES[0]);
})();
