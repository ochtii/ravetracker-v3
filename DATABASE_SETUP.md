# 🚀 RaveTracker v3 - Datenbank Initialisierung

## 📋 Übersicht

Diese Anleitung zeigt dir, wie du die RaveTracker v3 Datenbank komplett zurücksetzt und mit Test-Daten initialisierst.

## ⚠️ WICHTIGER HINWEIS

**Das SQL-Script `database_complete_reset.sql` LÖSCHT ALLE vorhandenen Daten!**
Verwende es nur bei einer kompletten Neuinstallation.

## 🔧 Schritt-für-Schritt Anleitung

### 1. Supabase Dashboard öffnen
- Gehe zu [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Logge dich mit deinem Account ein
- Wähle dein RaveTracker Projekt aus

### 2. SQL Editor aufrufen
- Klicke im linken Menü auf **"SQL Editor"**
- Oder verwende den direkten Link: `https://supabase.com/dashboard/project/[DEIN-PROJECT-ID]/sql`

### 3. SQL-Script ausführen
- Öffne die Datei `supabase/database_complete_reset.sql` in VS Code
- Kopiere den **gesamten Inhalt** (Strg+A, dann Strg+C)
- Füge ihn in den SQL Editor ein (Strg+V)
- Klicke auf **"Run"** um das Script auszuführen

### 4. Ausführung überwachen
Das Script wird:
- ✅ Alle vorhandenen Tabellen löschen
- ✅ Neue Tabellen mit korrekter Struktur erstellen
- ✅ Test-Benutzer anlegen
- ✅ Event-Kategorien erstellen
- ✅ Invite-Codes generieren
- ✅ Alle Berechtigungen (RLS) konfigurieren

## 👥 Test-Benutzer

Nach der Initialisierung sind folgende Test-Accounts verfügbar:

| Rolle | E-Mail | Passwort | Beschreibung |
|-------|---------|----------|--------------|
| 👑 **Admin** | admin@ravetracker.com | AdminSecure2025! | Vollzugriff auf alle Funktionen |
| 🛡️ **Moderator** | moderator@ravetracker.com | ModSecure2025! | Kann Events moderieren |
| 🎪 **Organizer** | organizer@ravetracker.com | OrgSecure2025! | Kann Events erstellen |
| 👤 **User** | user@ravetracker.com | UserSecure2025! | Standard-Benutzer |

## 🎫 Invite-Codes

Folgende Invite-Codes sind aktiv:

| Code | Verwendungen | Gültig bis | Beschreibung |
|------|-------------|------------|--------------|
| `ADMIN1` | ∞ | Permanent | Admin-Zugang |
| `WELCOM` | 100 | 30 Tage | Neuer Benutzer |
| `INVITE` | 50 | 7 Tage | Standard Einladung |
| `PARTY1` | 25 | 3 Tage | Event-spezifisch |
| `SECURE` | 10 | 1 Tag | Limitierter Zugang |

## 📊 Event-Kategorien

Das System enthält folgende Kategorien:

- 🎵 **Techno** - Electronic Dance Music Events
- 🏠 **House** - House Music Events  
- ⚡ **Trance** - Trance Music Events
- 🎹 **Drum & Bass** - Drum and Bass Events
- 🎪 **Festival** - Music Festivals
- 👥 **Club** - Club Events

## 🔍 Verifikation

### Tabellen prüfen
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Test-Benutzer prüfen
```sql
SELECT username, email, role, verification_level 
FROM profiles 
ORDER BY role;
```

### Event-Kategorien prüfen
```sql
SELECT name, description, color 
FROM event_categories 
ORDER BY name;
```

### Invite-Codes prüfen
```sql
SELECT code, max_uses, uses_count, expires_at 
FROM invites 
ORDER BY created_at;
```

## 🚀 Nächste Schritte

1. **Anwendung testen**: Starte deine RaveTracker v3 App mit `npm run dev`
2. **Login testen**: Verwende einen der Test-Accounts zum Einloggen
3. **Funktionen prüfen**: Teste Event-Erstellung, Benutzer-Registrierung, etc.
4. **Produktive Daten**: Ersetze Test-Daten durch echte Daten wenn bereit

## 🛠️ Troubleshooting

### Problem: "relation does not exist"
- **Lösung**: Stelle sicher, dass das komplette SQL-Script ausgeführt wurde
- **Check**: Prüfe die Tabellenliste in Supabase Dashboard

### Problem: Login funktioniert nicht
- **Lösung**: Prüfe ob die Test-Benutzer in der `auth.users` Tabelle vorhanden sind
- **Check**: `SELECT email FROM auth.users;`

### Problem: RLS Fehler
- **Lösung**: Alle RLS-Policies sind im Script enthalten
- **Check**: Prüfe die Policies im Supabase Dashboard unter "Authentication > Policies"

## 📞 Support

Bei Problemen prüfe:
1. Logs im Supabase Dashboard
2. Browser Entwicklertools (F12)
3. Network-Tab für API-Fehler

---

**🎉 Fertig! Deine RaveTracker v3 Datenbank ist vollständig initialisiert!**
