# Static Assets für RaveTracker v3.0

Dieser Ordner enthält statische Dateien, die direkt über URLs erreichbar sind.

## Struktur:
```
static/
├── favicon.ico
├── robots.txt
├── images/
│   ├── logo.svg
│   ├── hero/
│   └── events/
├── icons/
│   ├── manifest.json
│   └── pwa-icons/
└── uploads/
    └── events/
```

## URLs:
- `static/favicon.ico` → `http://domain.com/favicon.ico`
- `static/images/logo.svg` → `http://domain.com/images/logo.svg`
- `static/robots.txt` → `http://domain.com/robots.txt`

## Nginx Mapping:
- Nginx serviert diese Dateien direkt (bypass SvelteKit)
- Optimiert für Performance mit Caching Headers
- Immutable Assets bekommen lange Cache-Zeit
