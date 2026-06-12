// 「다음엔?」 목업 렌더링 로직 — 24시간 라이브 예측 (AI vs 유저 vs 나)
// 슬롯: 브랜드/라이브 헤더 · 마감 타이머 · 예측 질문(VS) · AI 예측 · 근거 ·
//       내 예측 · 유저 폴 · 예측 계속 보기 · 아고라X · 흐름 업데이트 · 결과 보기.
// 화면 카피는 "예측" 중심. 도박/베팅 톤 배제, 차분한 뉴스 톤 유지.

(function () {
  const articleEl = document.getElementById("article");
  const switcherBtns = document.querySelectorAll(".switcher__btn");
  let countdownTimer = null;

  const fmt = (n) => n.toLocaleString("ko-KR");
  const pad = (n) => String(n).padStart(2, "0");
  const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  // VS 막대 (선거 개표 그래픽). anim=true면 0에서 채움.
  function vsBar(opts, kind, anim) {
    const lead = opts[0].pct >= opts[1].pct ? 0 : 1;
    const w = (i) => (anim ? "width:0" : "width:" + opts[i].pct + "%");
    return `
      <div class="dn__vsbar dn__vsbar--${kind}">
        <div class="dn__vsseg dn__vsseg--a ${lead === 0 ? "is-lead" : ""}" style="${w(0)}" data-w="${opts[0].pct}">
          <span>${opts[0].label}</span><b>${opts[0].pct}%</b>
        </div>
        <div class="dn__vsseg dn__vsseg--b ${lead === 1 ? "is-lead" : ""}" style="${w(1)}" data-w="${opts[1].pct}">
          <b>${opts[1].pct}%</b><span>${opts[1].label}</span>
        </div>
      </div>`;
  }

  // AI와 유저 폴이 같은 방향인지 짧게
  function compareLine(ai, poll) {
    const a = ai[0].pct >= ai[1].pct ? ai[0] : ai[1];
    const p = poll[0].pct >= poll[1].pct ? poll[0] : poll[1];
    const pollClose = Math.abs(poll[0].pct - poll[1].pct) <= 6;
    if (pollClose) return `AI는 ‘${a.label}’, 유저 폴은 박빙이에요.`;
    if (a.label === p.label) return `AI와 유저가 모두 ‘${a.label}’를 보고 있어요.`;
    return `AI는 ‘${a.label}’, 유저는 ‘${p.label}’… 예측이 갈렸어요.`;
  }

  // 11. 결과 보기 (AI / 유저 폴 / 나 3자 비교)
  function resolvedPanel(f) {
    if (!f.resolved) {
      return `
        <div class="dn__resolved">
          <span class="dn__rbadge dn__rbadge--wait">결과 대기 중</span>
          <p class="dn__rmsg">예측 마감 후 결과가 확인되면 알려드릴게요.</p>
        </div>`;
    }
    const r = f.resolved;
    const cell = (lab, val, hit) => `
      <div class="dn__rcell ${hit ? "is-hit" : "is-miss"}">
        <span class="dn__rcell-lab">${lab}</span>
        <b class="dn__rcell-val">${val}</b>
        <span class="dn__rcell-mark">${hit ? "적중" : "빗나감"}</span>
      </div>`;
    return `
      <div class="dn__resolved">
        <span class="dn__rbadge">결과 확인</span>
        <p class="dn__routcome">${r.outcome}</p>
        <div class="dn__rgrid">
          ${cell("AI", `${r.ai.pick} ${r.ai.pct}%`, r.ai.hit)}
          ${cell("유저 폴", `${r.poll.pick} ${r.poll.pct}%`, r.poll.hit)}
          ${cell("내 예측", r.my.pick, r.my.hit)}
        </div>
        <div class="dn__rsummary">${r.summary}</div>
      </div>`;
  }

  function renderFlow(f) {
    const o = f.ai; // 선택지 라벨
    return `
      <section class="dn tone--${f.tone}" data-deadline="${f.deadlineSec}">

        <!-- 1. 브랜드 / 라이브 헤더 -->
        <div class="dn__brand">
          <span class="dn__brand-name">다음엔?</span>
          <span class="dn__brand-live"><i class="dn__dot"></i>LIVE</span>
          <button class="dn__settle" type="button">결과 보기</button>
        </div>
        <p class="dn__brand-sub">24시간 라이브 예측 · AI와 유저, 그리고 내 예측이 맞붙습니다.</p>

        <div class="dn__main">
          <!-- 2. 마감 타이머 -->
          <div class="dn__timer">
            <span class="dn__timer-stat">예측 진행중</span>
            <span class="dn__timer-main">남은 시간 <b class="dn__count">--:--:--</b></span>
            <span class="dn__timer-closed">예측 마감 · 결과를 기다리는 중</span>
          </div>
          <p class="dn__timer-sub">기사 송고 후 24시간 동안 참여할 수 있어요.</p>

          <!-- 3. 예측 질문 + VS 매치업 -->
          <h3 class="dn__q">${f.question}</h3>
          <div class="dn__matchup">
            <span class="dn__mu dn__mu--a">${o[0].label}</span>
            <span class="dn__mu-vs">VS</span>
            <span class="dn__mu dn__mu--b">${o[1].label}</span>
          </div>

          <!-- 4. AI 예측 -->
          <div class="dn__ai">
            <span class="dn__ai-lab">AI 예측</span>
            ${vsBar(f.ai, "ai", true)}
            <p class="dn__ai-sent">${f.aiSentence}</p>
          </div>

          <!-- 5. AI 판단 근거 -->
          <div class="dn__view">
            <h4 class="dn__view-title">왜 이렇게 예측했나요?</h4>
            <div class="dn__view-row is-pro">
              <span class="dn__view-lab">${f.proLabel}</span>
              <p>${f.pro}</p>
            </div>
            <div class="dn__view-row is-con">
              <span class="dn__view-lab">${f.conLabel}</span>
              <p>${f.con}</p>
            </div>
            <div class="dn__check">
              <span class="dn__check-lab">다음 체크포인트</span>
              <div class="dn__chips">${f.checkpoints.map((c) => `<span class="dn__chip">${c}</span>`).join("")}</div>
            </div>
          </div>

          <!-- 6. 내 예측 -->
          <div class="dn__mine">
            <span class="dn__slot-lab">내 예측</span>
            <p class="dn__mine-q">당신의 선택은?</p>
            <div class="dn__vs">
              <button class="dn__opt dn__opt--a" type="button" data-opt="${o[0].label}">${o[0].label}</button>
              <span class="dn__vsbadge">VS</span>
              <button class="dn__opt dn__opt--b" type="button" data-opt="${o[1].label}">${o[1].label}</button>
            </div>
            <p class="dn__mine-saved">내 예측 <b>—</b> · 예측이 저장됐어요. 결과가 나오면 비교해드릴게요.</p>
          </div>

          <!-- 7. 유저 폴 -->
          <div class="dn__poll is-locked">
            <span class="dn__slot-lab">유저 폴</span>
            <div class="dn__poll-lock">🔒 예측하면 다른 유저들의 선택을 볼 수 있어요</div>
            <div class="dn__poll-body">
              <p class="dn__poll-sub">다른 유저들은 이렇게 예측했어요.</p>
              ${vsBar(f.reader.options, "reader", true)}
              <div class="dn__poll-foot">
                <span class="dn__poll-total">${fmt(f.reader.total)}명 참여</span>
                <span class="dn__compare">${compareLine(f.ai, f.reader.options)}</span>
              </div>
            </div>
          </div>

          <!-- 8. 예측 계속 보기 -->
          <div class="dn__follow">
            <span class="dn__slot-lab">예측 계속 보기</span>
            <button class="dn__fcard" type="button">
              <span class="dn__fcard-ico">🔔</span>
              <span class="dn__fcard-body"><b>큰 변화면 알려줘</b><em>AI 예측이 크게 바뀌거나 결과가 나오면 알려드려요.</em></span>
            </button>
            <button class="dn__fcard" type="button">
              <span class="dn__fcard-ico">🔖</span>
              <span class="dn__fcard-body"><b>내 이슈에 저장</b><em>MY에서 이 예측을 계속 확인할 수 있어요.</em></span>
            </button>
          </div>

          <!-- 9. 아고라X -->
          <div class="dn__agora">
            <div class="dn__agora-card">
              <div class="dn__agora-head">
                <span class="dn__agora-chip">커뮤니티</span>
                <span class="dn__agora-brand">아고라X</span>
              </div>
              <p class="dn__agora-title">${f.agora.title}</p>
              <div class="dn__agora-post">
                <div class="dn__agora-post-top">
                  <span class="dn__agora-nick">${f.agora.sample.nick}</span>
                  <span class="dn__agora-pick">${f.agora.sample.pick}</span>
                </div>
                <p class="dn__agora-post-text">“${f.agora.sample.text}”</p>
                <span class="dn__agora-post-like">👍 ${fmt(f.agora.sample.likes)}</span>
              </div>
              <p class="dn__agora-desc">${f.agora.desc}</p>
              <div class="dn__agora-btns">
                <button class="cta cta--primary" type="button">의견 쓰기</button>
                <button class="cta" type="button">투표 보기</button>
              </div>
            </div>
          </div>

          <!-- 10. 흐름 업데이트 + 이 흐름 더보기 -->
          <div class="dn__updates">
            <h4>흐름 업데이트</h4>
            ${f.updates
              .map((u) => `<div class="dn__upd"><span class="dn__upd-time">${u.time}</span><p>${u.text}</p></div>`)
              .join("")}
            <button class="dn__moreflow" type="button">
              <b>이 흐름 더보기</b>
              <em>관련 기사 · 주요 데이터 · 예측 변화 이유</em>
            </button>
          </div>
        </div>

        <!-- 11. 결과 보기 -->
        ${resolvedPanel(f)}

        <p class="dn__note">${f.note}</p>
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

  function fillPoll(card) {
    card.querySelectorAll(".dn__poll .dn__vsseg").forEach((s) => {
      s.style.width = s.dataset.w + "%";
    });
  }

  function bindCard() {
    const card = articleEl.querySelector(".dn");
    if (!card) return;

    // AI 막대 애니메이션
    requestAnimationFrame(() => {
      card.querySelectorAll(".dn__vsbar--ai .dn__vsseg").forEach((s) => {
        s.style.width = s.dataset.w + "%";
      });
    });

    // 내 예측 → 유저 폴 공개
    card.querySelectorAll(".dn__opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (card.classList.contains("is-closed")) return;
        card.querySelectorAll(".dn__opt").forEach((b) => {
          b.classList.remove("is-picked");
          b.disabled = true;
        });
        btn.classList.add("is-picked");
        const my = card.querySelector(".dn__mine-saved b");
        if (my) my.textContent = btn.dataset.opt;
        card.querySelector(".dn__mine").classList.add("is-voted");
        card.querySelector(".dn__poll").classList.remove("is-locked");
        requestAnimationFrame(() => fillPoll(card));
      });
    });

    // 결과 보기 토글
    const settle = card.querySelector(".dn__settle");
    settle.addEventListener("click", () => {
      const on = card.classList.toggle("show-resolved");
      settle.textContent = on ? "← 예측으로" : "결과 보기";
    });

    // 24시간 카운트다운
    const statEl = card.querySelector(".dn__timer-stat");
    const mainEl = card.querySelector(".dn__timer-main");
    let sec = parseInt(card.dataset.deadline, 10) || 0;
    clearInterval(countdownTimer);
    const tick = () => {
      if (sec <= 0) {
        card.classList.remove("is-soon");
        card.classList.add("is-closed");
        card.querySelectorAll(".dn__opt").forEach((b) => (b.disabled = true));
        const poll = card.querySelector(".dn__poll");
        if (poll.classList.contains("is-locked")) {
          poll.classList.remove("is-locked");
          requestAnimationFrame(() => fillPoll(card));
        }
        clearInterval(countdownTimer);
        return;
      }
      if (sec <= 3600) {
        card.classList.add("is-soon");
        statEl.textContent = "마감임박";
        mainEl.innerHTML = `<b class="dn__count">${hms(sec)}</b> 남음`;
      } else {
        statEl.textContent = "예측 진행중";
        mainEl.innerHTML = `남은 시간 <b class="dn__count">${hms(sec)}</b>`;
      }
      sec--;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
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
        <span class="handoff__txt">이 기사, 결과는 어떻게 될까요?</span>
        <span class="handoff__line"></span>
      </div>
      <p class="handoff__sub">AI 예측 · 유저 폴 · 내 선택을 24시간 동안 비교해보세요.</p>

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
