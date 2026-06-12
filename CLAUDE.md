# predictq

다음 기사뷰 하단 예측 카드 Agent **PredictQ** 의 공모전 출품 목업.

## 원격 저장소
git@github.com:nanriblue/predictq.git

## 기술 스택
- 순수 정적 HTML / CSS / JavaScript (빌드 도구·의존성 없음)
- GitHub Pages 배포

## 실행 방법
```bash
python3 -m http.server 4173
# http://localhost:4173
```

## 프로젝트 구조
```
index.html   # 화면 골격 + 예시 전환 탭
styles.css   # 스타일
data.js      # 예시 기사 3종 + 예측 카드 데이터
app.js       # 렌더링 로직
```

## 작업 규칙
- 새 예시 기사는 data.js 의 ARTICLES 배열에 추가 (구조 유지).
- 민감 이슈(sensitive: true)는 반드시 disclaimers 를 함께 작성할 것 — 단정 표현 금지.
- 빌드 단계 없이 GitHub Pages 루트에서 바로 동작해야 하므로 외부 의존성을 추가하지 말 것.
