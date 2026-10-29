# daylog · 계획 대비 실제 활동

설치할 라이브러리 없이 동작하는 GitHub Pages용 정적 사이트입니다. 현재 샘플 화면이며 실제 개인 기록은 포함하지 않습니다. 저장소: https://github.com/saemijung00/daylog

사이트: https://saemijung00.github.io/daylog/

## 안전한 기본 구성

Google Calendar (읽기 전용 OAuth) → 개인 컴퓨터 또는 비공개 실행 환경 → 필요한 필드만 추출 → PBKDF2-SHA256 600,000회 + AES-256-GCM → 암호화 리포트 파일 → 공개 Pages 화면에서 파일 선택·브라우저 복호화.

처음에는 화면만 공개하고 암호화 파일도 로컬에서 선택하는 방식을 권장합니다. 자동 갱신이 필요하면 암호화 파일만 Pages 배포 산출물에 추가할 수 있습니다. 원본 JSON, OAuth 정보, Calendar ID, 암호는 공개 저장소와 배포 산출물에 넣지 않습니다. 공개된 암호화 파일은 누구나 내려받아 암호 대입을 시도할 수 있으므로 재사용하지 않는 20자 이상의 무작위 암호를 사용하세요. 암호를 잊으면 복구할 수 없고 다시 내보내야 합니다.

사이트는 외부 분석·폰트·스크립트를 사용하지 않습니다. 복호화 데이터와 암호는 저장소/쿠키/localStorage에 저장하지 않습니다. 암호화된 리포트만 localStorage에 보관해 다음 방문 시 파일 선택 없이 암호로 다시 열 수 있습니다. '저장된 기록 지우기'로 삭제할 수 있습니다. '잠그기'는 화면과 앱 참조를 초기화합니다. JavaScript 메모리의 물리적 소거를 보장하지는 않습니다.

## 실행과 검증

Node.js 22 이상: `npm test`

미리보기: `python3 -m http.server 8765 --directory docs`

브라우저에서 http://localhost:8765 로 접속합니다. Web Crypto는 HTTPS 또는 localhost에서 동작합니다.

## 개인 데이터 연결

1. Google Cloud에서 Calendar API를 활성화하고 본인용 OAuth 클라이언트를 준비합니다. 읽기 범위 `https://www.googleapis.com/auth/calendar.events.readonly`로 오프라인 refresh token을 발급받습니다. 토큰 발급 자체는 이 앱에서 처리하지 않습니다. Google OAuth 동의 화면의 테스트 상태에서는 갱신 토큰 만료에 주의합니다.
2. `config.example.json`을 `private/config.json`으로 복사합니다. 각 ID는 비공개 설정에만 입력합니다. ID 목록 조회도 필요하면 별도의 calendarlist.readonly 권한을 사용합니다. 스크립트 자체는 ID를 설정에서 읽으므로 그 권한이 필요하지 않습니다.
3. `from`은 포함, `to`는 제외 날짜입니다. 주간 통계·과거 수정을 포함하도록 원하는 전체 보존 범위를 설정합니다.
4. 비공개 환경에서 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, REPORT_PASSWORD를 설정하고 `npm run sync`를 실행합니다. 명령행 인자나 커밋에 값을 넣지 마세요.
5. 생성된 `docs/report.enc.json`을 사이트에서 선택하고 암호를 입력합니다. 파일은 기본적으로 Git에서 제외됩니다. Google 인증 정보는 브라우저로 전달되지 않습니다.

스크립트는 Google에 token 교환과 events.list 읽기 요청만 보냅니다. 모든 페이지를 읽고 모든 캘린더가 성공한 후 암호화 파일을 원자적으로 교체합니다. 실패하면 이전 파일이 유지됩니다. 원본 일정 생성·수정·삭제 API는 사용하지 않습니다. 로그에 제목·ID·토큰을 출력하지 않습니다.

## 집계 규칙

- Plan은 계획 전용. 나머지 6개 캘린더에서는 `[실제]`로 시작하는 시간 지정 일정만 실제 활동으로 인정합니다. 원본이 transparent여도 실제 기록이면 포함합니다.
- 종일 일정·기간형 마감·실제 표시 없는 일정은 시간 집계 제외입니다. 제외 개수를 표시합니다.
- iCalUID(없으면 event ID) + 반복 발생 원래 시작 시각 + 계획/실제 역할로 중복 제거합니다. 작업 캘린더 일정이 새미에 초대 복사된 경우 organizer를 사용해 원래 분류를 유지합니다.
- 다른 ID로 수동 복사한 일정은 동일한 제목만으로 삭제하지 않습니다. 시간은 합집합으로 세어 총합 중복을 막습니다. 서로 다른 분류가 동시에 존재하면 해당 시간은 '분류 충돌'로 분리합니다. 의도적인 동시 작업도 같은 규칙입니다.
- 반복 일정은 API의 singleEvents=true로 펼칩니다. 취소된 일정은 제외합니다. 매번 설정 범위 전체를 새로 읽으므로 이전 삭제·이동·수정이 다음 성공 동기화에 반영됩니다. 증분 토큰 캐시를 혼합하지 않습니다.
- 모든 하루는 Asia/Seoul 00:00–다음날 00:00 반열린 구간입니다. 자정을 가로지르면 날짜별로 나눕니다.
- 실제·미확인은 현재 시각과 동기화 시각 중 이른 시점까지 계산합니다. 미래 구간을 미확인으로 세지 않습니다. 00시부터 기록 없는 모든 경과 시간은 미확인이며 수면으로 추정하지 않습니다.
- 계획 시간은 하루 전체, 실제 시간과 '계획 시간대 기록'은 경과 구간입니다. 겹침은 작업 달성률이 아닙니다. Plan에는 분류 정보가 없으므로 분류별 계획을 임의 추정하지 않습니다.
- 주간은 월–일이며 동기화 범위 밖 날짜는 0시간과 구분합니다. 분류 시간은 확인된 실제 기준입니다.

## 자정 리포트와 자동화

한국 시간 하루가 끝나고 해당 시각 이후 동기화한 경우 '자정 리포트'를 표시합니다. 자정 직전 동기화된 파일은 다음날이 되어도 잠정 상태를 유지합니다. 과거 기록 변경은 다음 전체 동기화에서 반영되므로 종료 리포트도 수정될 수 있습니다. 생성 당시 불변 스냅샷 보관 기능은 포함하지 않습니다.

자동화는 저장소 확정 후 별도의 비공개 저장소 또는 개인 컴퓨터에서 실행하도록 구성합니다. 예: 매일 00:10 KST (= 전날 15:10 UTC)에 sync 실행. GitHub Actions의 예약 실행은 지연/누락될 수 있으므로 정확히 00:00 생성이라고 표시하지 않고 실제 generatedAt을 보여줍니다. 실패 시 이전 파일을 유지하고 실행 실패를 확인해야 합니다. 공개 Pages 저장소의 PR에서 인증정보를 사용하는 동기화는 실행하지 마세요.

## Pages 배포

현재 배포는 GitHub Pages의 Deploy from a branch → main → /docs 설정을 사용합니다. main의 docs/ 변경이 자동 배포됩니다. 원본 JSON과 인증 정보는 업로드하지 않습니다. 공개되는 첫 화면은 샘플이며 사용자 기록은 암호화 파일을 선택해서 엽니다.

## 근거

- Google events.list: https://developers.google.com/calendar/api/v3/reference/events/list
- OAuth 범위: https://developers.google.com/workspace/calendar/api/auth
- Pages 접근 범위: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- 예약 실행 지연: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## 자동 동기화 연결 (calendar-sync.yml)

매시 10분에 전체 보존 범위를 다시 읽고, 암호화 성공 후에만 Pages 산출물을 배포합니다. 실패하면 기존 사이트를 유지합니다. `to`를 생략하면 한국 날짜 기준 모레 00:00까지 자동 확장합니다. `from`은 최초 보존 날짜로 고정하세요. 사이트는 5분마다 새 암호화 파일을 확인하며 암호 입력 시 서버의 최신 파일을 우선합니다. 암호는 보관하지 않으므로 새 결과를 열 때 다시 입력합니다.

저장소 Actions secrets에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `REPORT_PASSWORD`, `CALENDAR_CONFIG`가 필요합니다. 마지막 값은 실제 7개 캘린더 ID와 `from`이 들어간 config.example.json 형식 JSON입니다. 개인 ID를 example 파일이나 공개 커밋에 쓰지 마세요. ChatGPT Calendar 연결의 인증은 GitHub 실행 환경에 전달되지 않으므로 별도 오프라인 읽기 전용 OAuth 인증이 필요합니다. 이 저장소의 Pages source를 GitHub Actions로 설정하고 Actions의 Private Calendar sync and Pages를 수동 실행하여 첫 배포를 확인하세요. 인증/설정이 없으면 작업은 명시적으로 실패하고 샘플을 실제 기록이라고 표시하지 않습니다.
