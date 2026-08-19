# feature 브랜치

각 작업은 최신 `dev`에서 독립적인 기능 브랜치를 만들어 진행합니다.

```bash
git switch dev
git pull origin dev
git switch -c feature/작업명-이름
```

작업을 올릴 때:

```bash
git add .
git commit -m "feat: 작업 설명"
git push -u origin feature/작업명-이름
```

완료 후 GitHub에서 `feature/작업명-이름 → dev` PR을 만들고, 직접 병합하지 않습니다.
