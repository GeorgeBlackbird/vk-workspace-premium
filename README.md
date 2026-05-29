# VK Teams Plus

Расширяемое Chrome-дополнение для [VK Teams](https://teams.vk.com/) с модульной архитектурой фич.

## Быстрый старт

```bash
cd vk-teams-plus
npm install
npm run icons
npm run build
```

Загрузка в Chrome: `chrome://extensions` → «Режим разработчика» → «Загрузить распакованное» → папка `dist/`.

При разработке:

```bash
npm run dev
```

После каждой пересборки нажмите «Обновить» на карточке расширения и перезагрузите вкладку VK Teams.

## Архитектура

```
src/
  core/           # storage, registry, messaging, типы
  content/        # точка входа на странице Teams
  background/     # service worker
  features/       # одна папка = одна фича
    theme/        # первая фича (фон + акцент)
    _template/    # шаблон для новых фич
  pages/          # options + popup
```

**Новая фича:** скопируйте `src/features/_template/`, реализуйте `init`, добавьте в `src/content/index.ts`:

```ts
import "@/features/my-feature";
```

## Домены

- Оболочка: `https://app.workspace.vk.ru/*`
- Мессенджер (iframe): `https://myteam.mail.ru/*`

Content script запускается во всех фреймах (`all_frames`). Для on-prem добавьте свои хосты в `manifest.config.ts`.

## Тема

Переопределяет VKUI- и IM-токены (`--vkui--*`, `--theme-color-*`) на WorkSpace и в iframe мессенджера: фоны, текст, пузыри, меню, модалки.

- **Настройки** → раздел «Сохранённые темы»: несколько пресетов, экспорт/импорт JSON для обмена с коллегами.
- **Попап** расширения: быстрое переключение между сохранёнными темами.
- **Светлая тема**: задайте светлый фон (`#f0f2f5`) — основной и вторичный текст подстроятся автоматически, либо укажите в «Дополнительные цвета».
- Встроенные пресеты: «Тёмная (VK Teams)» и «Светлая (пример)».

Формат экспорта одной темы: `{ "type": "vk-teams-plus-theme", "settings": { ... } }`. Нескольких: `{ "type": "vk-teams-plus-themes", "presets": [ ... ] }`.

После изменений обновите вкладку мессенджера.

## Сборка релиза

```bash
npm run build
# Упакуйте папку dist/ в zip для публикации или распространения внутри компании
```
