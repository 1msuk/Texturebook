# 📚 텍스처북 (Texturebook)

> 책의 질감과 풍미를 음미하는 텍스트 퍼스트 북 커뮤니티

## 🚀 시작하기

### 1단계 — 저장소 클론
```bash
git clone https://github.com/YOUR_ID/texturebook.git
cd texturebook
npm install
```

### 2단계 — 환경변수 설정 (.env)
```bash
cp .env.example .env
```
`.env` 파일을 열고, Firebase 콘솔에서 복사한 실제 값을 입력하세요.
- 👉 Firebase 콘솔: https://console.firebase.google.com
- 프로젝트 설정 → 앱 → "내 앱의 Firebase 구성" → 값 복사

```env
VITE_FIREBASE_API_KEY=실제값
VITE_FIREBASE_AUTH_DOMAIN=실제값
VITE_FIREBASE_PROJECT_ID=실제값
VITE_FIREBASE_STORAGE_BUCKET=실제값
VITE_FIREBASE_MESSAGING_SENDER_ID=실제값
VITE_FIREBASE_APP_ID=실제값
```

### 3단계 — 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:5173 열기

---

## 🔥 Firebase 설정

### Firebase 콘솔에서 활성화할 항목
1. **Authentication** → 로그인 방법 → 이메일/비밀번호 ✅, Google ✅
2. **Firestore Database** → 데이터베이스 만들기 → 프로덕션 모드
3. **Storage** → 시작하기

### 보안 규칙 배포
```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools
firebase login

# 규칙 배포
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 📁 프로젝트 구조

```
src/
├── firebase/
│   └── firebase.js          # Firebase 초기화
├── context/
│   └── AuthContext.jsx      # 전역 인증 상태
├── hooks/
│   └── useFollow.js         # 팔로우 훅
├── utils/
│   ├── badges.js            # 칭호 설정
│   └── uploadMedia.js       # 미디어 업로드
├── components/
│   ├── BadgeTag.jsx         # 칭호 뱃지 컴포넌트
│   ├── PostEditor.jsx       # 글쓰기 에디터
│   └── PostDetail.jsx       # 게시물 상세 + 리액션 + 댓글
└── pages/
    ├── HomePage.jsx         # 메인 피드
    ├── LoginPage.jsx        # 로그인/회원가입
    ├── WritePage.jsx        # 글쓰기 페이지
    └── PostPage.jsx         # 게시물 상세 페이지
```

---

## ⚠️ 보안 주의사항
- `.env` 파일은 절대 GitHub에 올리지 마세요 (`.gitignore`에 포함됨)
- Firebase 콘솔 → "승인된 도메인"에 배포 도메인만 등록하세요
- Firestore Security Rules와 Storage Rules를 반드시 배포하세요
