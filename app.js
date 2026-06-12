// 「다음엔?」 목업 렌더링 로직 — 라이브 예측 카드
// 24시간 카운트다운 + AI 예측 vs 사용자 투표 vs 독자 예측(VS 구도) + 아고라X + 결과 확인.
// 화면 카피는 "예측" 중심. 도박/베팅 톤은 피하고 차분한 뉴스 톤 유지.

(function () {
  const articleEl = document.getElementById("article");
  const switcherBtns = document.querySelectorAll(".switcher__btn");
  let countdownTimer = null;

  const fmt = (n) => n.toLocaleString("ko-KR");
  const pad = (n) => String(n).padStart(2, "0");
  const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  // 박빙 / 현재 우세 (AI 격차 기준)
  function gapStatus(ai) {
    return Math.abs(ai[0].pct - ai[1].pct) <= 10 ? "박빙" : "현재 우세";
  }

  // AI와 독자가 같은 방향인지 다른 방향인지 한 줄로
  function compareLine(ai, reader) {
    const aiLead = ai[0].pct >= ai[1].pct ? ai[0] : ai[1];
    const rdLead = reader[0].pct >= reader[1].pct ? reader[0] : reader[1];
    if (aiLead.label === rdLead.label) {
      return `AI와 독자가 모두 ‘${aiLead.label}’ 쪽을 보고 있어요.`;
    }
    return `AI는 ‘${aiLead.label}’, 독자는 ‘${rdLead.label}’ 쪽으로 갈렸어요.`;
  }

  // VS 막대 (선거 개표 그래픽처럼 좌우가 밀고 당김). anim=true면 0에서 채움.
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

  // 결과 확인 패널
  function resolvedPanel(f) {
    if (!f.resolved) {
      return `
        <div class="dn__resolved">
          <span class="dn__rbadge dn__rbadge--wait">결과 대기 중</span>
          <p class="dn__rmsg">결과가 확인되면 이 자리에서 AI·독자·내 예측과 적중 여부를 보여드려요.</p>
        </div>`;
    }
    const r = f.resolved;
    return `
      <div class="dn__resolved">
        <span class="dn__rbadge">결과 확인</span>
        <p class="dn__routcome">${r.outcome}</p>
        <ul class="dn__rlist">
          <li><span>AI 예측</span><b>${r.ai}</b></li>
          <li><span>독자 예측</span><b>${r.reader}</b></li>
          <li><span>내 예측</span><b>${r.my}</b></li>
        </ul>
        <div class="dn__rresult ${r.hit ? "is-hit" : "is-miss"}">결과: ${r.hit ? "적중" : "빗나감"}</div>
      </div>`;
  }

  function renderFlow(f) {
    return `
      <section class="dn tone--${f.tone}" data-deadline="${f.deadlineSec}">
        <div class="dn__head">
          <span class="dn__logo">다음엔?</span>
          <span class="dn__tag">라이브 예측</span>
          <button class="dn__settle" type="button">결과 보기</button>
        </div>

        <!-- 24시간 라이브 상태 -->
        <div class="dn__live">
          <div class="dn__live-top">
            <span class="dn__live-badge"><i class="dn__dot"></i>LIVE · 예측 진행 중</span>
            <span class="dn__live-soon">마감 임박</span>
            <span class="dn__gap">${gapStatus(f.ai)}</span>
          </div>
          <div class="dn__count-wrap">남은 시간 <span class="dn__count">--:--:--</span></div>
          <p class="dn__live-note">기사 송고 후 24시간 동안 참여할 수 있어요.</p>
          <div class="dn__closed">투표 마감 · 결과를 기다리는 중</div>
        </div>

        <div class="dn__main">
          <h3 class="dn__q">${f.question}</h3>

          <!-- AI 예측 -->
          <div class="dn__ai">
            <span class="dn__ai-lab">AI 예측</span>
            ${vsBar(f.ai, "ai", true)}
            <p class="dn__ai-sent">${f.aiSentence}</p>
          </div>

          <!-- AI 예측 근거 (바로 아래) -->
          <div class="dn__view">
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

          <!-- 사용자 투표 (VS 대결) -->
          <div class="dn__vote">
            <span class="dn__vote-lab">당신의 예측은?</span>
            <div class="dn__vs">
              <button class="dn__opt dn__opt--a" type="button" data-opt="${f.ai[0].label}">${f.ai[0].label}</button>
              <span class="dn__vsbadge">VS</span>
              <button class="dn__opt dn__opt--b" type="button" data-opt="${f.ai[1].label}">${f.ai[1].label}</button>
            </div>
            <p class="dn__mypick">내 예측 <b>—</b></p>
          </div>

          <!-- 독자 예측 (투표 후 공개) -->
          <div class="dn__reader is-locked">
            <div class="dn__reader-lock">🔒 투표하면 독자 예측을 볼 수 있어요</div>
            <div class="dn__reader-body">
              <div class="dn__reader-head"><span>독자 예측</span><em>총 ${fmt(f.reader.total)}명 참여</em></div>
              ${vsBar(f.reader.options, "reader", true)}
              <p class="dn__compare">${compareLine(f.ai, f.reader.options)}</p>
            </div>
          </div>

          <!-- 아고라X 커뮤니티 -->
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

          <!-- 액션 버튼 -->
          <div class="dn__actions">
            <button class="act act--primary" type="button">
              <span class="act__ico">🔔</span>
              <span class="act__body"><b>큰 변화면 알려줘</b><em>예측이 크게 바뀌면 알림</em></span>
            </button>
            <div class="dn__actions-row">
              <button class="act act--sub" type="button">
                <span class="act__ico">📈</span>
                <span class="act__body"><b>이 흐름 더보기</b><em>관련 기사와 데이터</em></span>
              </button>
              <button class="act act--sub" type="button">
                <span class="act__ico">🔖</span>
                <span class="act__body"><b>내 이슈에 저장</b><em>MY에서 계속 보기</em></span>
              </button>
            </div>
          </div>

          <!-- 흐름 업데이트 -->
          <div class="dn__updates">
            <h4>흐름 업데이트</h4>
            ${f.updates
              .map((u) => `<div class="dn__upd"><span class="dn__upd-time">${u.time}</span><p>${u.text}</p></div>`)
              .join("")}
          </div>
        </div>

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

  // 독자 예측 막대 채우기
  function fillReader(card) {
    card.querySelectorAll(".dn__reader .dn__vsseg").forEach((s) => {
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

    // 사용자 투표 → 독자 예측 공개
    card.querySelectorAll(".dn__opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (card.classList.contains("is-closed")) return;
        card.querySelectorAll(".dn__opt").forEach((b) => {
          b.classList.remove("is-picked");
          b.disabled = true;
        });
        btn.classList.add("is-picked");
        const my = card.querySelector(".dn__mypick b");
        if (my) my.textContent = btn.dataset.opt;
        card.querySelector(".dn__reader").classList.remove("is-locked");
        requestAnimationFrame(() => fillReader(card));
      });
    });

    // 결과 보기 토글
    const settle = card.querySelector(".dn__settle");
    settle.addEventListener("click", () => {
      const on = card.classList.toggle("show-resolved");
      settle.textContent = on ? "← 예측 카드로" : "결과 보기";
    });

    // 24시간 카운트다운
    const countEl = card.querySelector(".dn__count");
    let sec = parseInt(card.dataset.deadline, 10) || 0;
    clearInterval(countdownTimer);
    const tick = () => {
      if (sec <= 0) {
        card.classList.remove("is-soon");
        card.classList.add("is-closed");
        // 마감 시 투표 비활성화 + 독자 예측 공개
        card.querySelectorAll(".dn__opt").forEach((b) => (b.disabled = true));
        const reader = card.querySelector(".dn__reader");
        if (reader.classList.contains("is-locked")) {
          reader.classList.remove("is-locked");
          requestAnimationFrame(() => fillReader(card));
        }
        clearInterval(countdownTimer);
        return;
      }
      countEl.textContent = hms(sec);
      card.classList.toggle("is-soon", sec <= 3600);
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
      <p class="handoff__sub">AI 예측과 독자 투표가 24시간 동안 함께 움직입니다.</p>

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
