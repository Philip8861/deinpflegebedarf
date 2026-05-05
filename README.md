# Dein Pflegebedarf — Shopify Theme

Eigenes Store-Theme auf Basis von **[Shopify Dawn](https://github.com/Shopify/dawn)** (Online Store 2.0). Dieses Repository: **[github.com/Philip8861/deinpflegebedarf](https://github.com/Philip8861/deinpflegebedarf)**.

**Basis:** Dawn 15.4.1 · **Theme-Version (Fork):** siehe `theme_info` in [`config/settings_schema.json`](config/settings_schema.json).

## Schnellstart

- [Shopify Themes — Einrichtung](https://shopify.dev/docs/themes/tools/cli)
- Theme mit Shopify CLI verbinden, Preview-Theme verwenden, **nicht** direkt das Live-Theme ohne Tests überschreiben.

## Mit Dawn synchron halten (optional)

```sh
git remote add upstream https://github.com/Shopify/dawn.git   # falls noch nicht gesetzt
git fetch upstream
git merge upstream/main    # Konflikte bewusst lösen
```

## Entwicklung

| Thema | Hinweis |
|--------|---------|
| **Theme Check** | `shopify theme check` |
| **VS Code** | Extension „Theme Check“ (siehe `.vscode/extensions.json`) |
| **CI** | In diesem Repo läuft auf jedem Push **Theme Check** via GitHub Actions. Lighthouse-CI ist deaktiviert, bis Shopify-Store-Secrets gesetzt sind (siehe `.github/workflows/ci.yml`). |

Ausführliche Hintergründe zu Dawn (Prinzipien, Contributing, Theme Store): weiterhin in den Originalen unter [Shopify/dawn](https://github.com/Shopify/dawn).

## Lizenz

Copyright (c) 2021-present Shopify Inc. für den Dawn-Bestandteil — siehe [LICENSE.md](LICENSE.md).
