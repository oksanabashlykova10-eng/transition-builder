# Transition Builder by English Bootcamp

Визуальный редактор автономных анимированных переходов для встраивания в Genially.

## Локальный запуск

```bash
npm ci
npm run dev
```

Проверка перед публикацией:

```bash
npm test
npm run build
```

## Публикация на GitHub Pages

1. Создайте на GitHub репозиторий, например `transition-builder`.
2. Загрузите проект в ветку `main`.
3. В репозитории откройте **Settings → Pages** и выберите **GitHub Actions** в качестве источника публикации.
4. Workflow `Deploy to GitHub Pages` проверит проект, соберёт его и опубликует папку `dist`.

Адрес проекта будет иметь вид:

```text
https://GITHUB-USERNAME.github.io/REPOSITORY-NAME/
```

## Встраивание редактора

```html
<iframe
  src="https://GITHUB-USERNAME.github.io/REPOSITORY-NAME/"
  title="Transition Builder by English Bootcamp"
  width="1200"
  height="760"
  style="width:100%;max-width:1200px;border:0;"
  allow="clipboard-write; fullscreen"
  loading="eager"
></iframe>
```

Проекты сохраняются локально в браузере пользователя. Для переноса между браузерами и устройствами используйте экспорт и импорт файла проекта.

