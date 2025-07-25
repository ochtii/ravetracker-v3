# 🔄 Supabase Konfiguration Reset & Neues Projekt Setup

## 🗑️ Schritt 1: Alte Konfiguration löschen

### Lokale Dateien löschen:
```bash
# Supabase lokale Konfiguration löschen
rm -rf supabase/.temp
rm -rf supabase/functions
rm -rf supabase/migrations

# Optional: Alte SQL-Dateien aufräumen
rm -f supabase/database_complete_reset.sql
rm -f supabase/debug_categories.sql
rm -f supabase/step_by_step_debug.sql
```

### .env Datei zurücksetzen:
```bash
# Backup der aktuellen .env erstellen
cp .env .env.backup

# .env für neues Projekt vorbereiten
```

## 🆕 Schritt 2: Neues Supabase Projekt erstellen

### 1. Supabase Dashboard
- Gehe zu [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Klicke auf **"New Project"**
- Wähle eine Organization aus
- Projektname: `ravetracker-v3-new` (oder eigener Name)
- Datenbank Passwort: **Sicheres Passwort wählen!**
- Region: `Europe West (Frankfurt)` (empfohlen für Deutschland)
- Plan: **Free** (für Entwicklung)

### 2. Warte auf Projekt-Erstellung
⏱️ Das dauert ca. 2-3 Minuten...

### 3. Projekt-Daten sammeln
Nach der Erstellung findest du unter **Settings > API**:
- 📝 **Project URL**: `https://[PROJECT-REF].supabase.co`
- 🔑 **Anon Key**: `eyJhbGciOiJIUzI1NiIs...`
- 🔐 **Service Role Key**: `eyJhbGciOiJIUzI1NiIs...` (falls benötigt)

## ⚙️ Schritt 3: Neue Konfiguration anwenden

### 1. .env Datei aktualisieren
```bash
# Automatisch mit Script:
node scripts/setup-new-supabase.mjs

# Oder manuell die .env bearbeiten
```

### 2. Supabase CLI neu initialisieren
```bash
# Supabase CLI login (falls noch nicht eingeloggt)
npx supabase login

# Neues Projekt verknüpfen
npx supabase init
npx supabase link --project-ref [DEINE-PROJECT-REF]

# Lokale Entwicklung starten (optional)
npx supabase start
```

## 🗄️ Schritt 4: Datenbank initialisieren

### 1. SQL-Script in Supabase ausführen
- Gehe zu **SQL Editor** in Supabase Dashboard
- Führe `safe_database_reset.sql` aus
- Oder verwende: `step_by_step_debug.sql` für schrittweise Initialisierung

### 2. Verifikation
```bash
# Datenbank testen
node scripts/verify-database.mjs
```

Erwartete Ausgabe: **80-100% Erfolgsrate** ✅

## 🔧 Schritt 5: Anwendung testen

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# In Browser öffnen
# http://localhost:5173
```

## 📋 Checklist

- [ ] Altes Supabase Projekt gelöscht/deaktiviert
- [ ] Neues Projekt in Supabase Dashboard erstellt
- [ ] .env Datei mit neuen Credentials aktualisiert
- [ ] Supabase CLI mit neuem Projekt verknüpft
- [ ] Datenbank mit SQL-Script initialisiert
- [ ] Verifikation erfolgreich (>80%)
- [ ] Anwendung läuft lokal
- [ ] Test-Login funktioniert

## 🆘 Troubleshooting

### Problem: "Project not found"
```bash
# CLI neu verknüpfen
npx supabase unlink
npx supabase link --project-ref [NEUE-PROJECT-REF]
```

### Problem: "Invalid API key"
- ✅ Prüfe .env Datei
- ✅ Kopiere Keys direkt aus Supabase Dashboard
- ✅ Restart der Anwendung: `npm run dev`

### Problem: Tabellen existieren nicht
- ✅ SQL-Script in Supabase Dashboard ausführen
- ✅ Nicht in lokaler CLI - sondern im Web-Dashboard!

---

**🎯 Nach diesem Setup hast du ein komplett frisches Supabase Projekt!**
