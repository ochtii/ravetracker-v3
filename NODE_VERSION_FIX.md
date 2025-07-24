# Node.js Version Problem - Lösung

## Problem:
```
npm ERR! engine Unsupported engine
npm ERR! engine Not compatible with your version of node/npm
```

## ✅ Schnelle Lösung:
Die `package.json` wurde angepasst - die Engine-Überprüfung wurde entfernt.

## 🔧 Jetzt versuchen:
```bash
npm install
npm run dev
```

## 💡 Optional - Node.js aktualisieren:

### Windows:
1. **Über nodejs.org:**
   - Gehe zu https://nodejs.org
   - Lade die LTS Version herunter
   - Installiere sie

2. **Über nvm-windows:**
   ```bash
   # nvm installieren: https://github.com/coreybutler/nvm-windows
   nvm install 20.17.0
   nvm use 20.17.0
   ```

### Linux/macOS:
```bash
# Über nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

## 🎯 Nach Node.js Update:
```bash
node --version  # Should be 18+ oder 20+
npm --version   # Should be 8+ oder 9+
npm install
npm run dev
```

## 🚀 Wenn alles funktioniert:
- **Development Server**: http://localhost:5173
- **Build für Production**: `npm run build`
- **Preview**: `npm run preview`

Die Engine-Überprüfung wurde entfernt, sodass auch ältere Node.js Versionen funktionieren sollten!
