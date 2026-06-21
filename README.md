# 📚 텍스처북 (Texturebook)


```
## 웹 배포 주소 : https://texturebook.vercel.app/

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



## ⚠️ 보안 주의사항
- `.env` 파일은 절대 GitHub에 올리지 마세요 (`.gitignore`에 포함됨)
- Firebase 콘솔 → "승인된 도메인"에 배포 도메인만 등록하세요
- Firestore Security Rules와 Storage Rules를 반드시 배포하세요
