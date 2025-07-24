# Invite System Spezifikation - RaveTracker v3

## 🎯 Überblick

Das Invite-System transformiert RaveTracker von einer offenen zu einer invite-basierten Plattform, um die Qualität der Community zu erhöhen und Spam zu reduzieren.

---

## 🏗️ Systemarchitektur

### Kernprinzipien
- **Geschlossene Registrierung**: Nur mit gültigem Invite-Code möglich
- **Verifizierte Community**: Mehrstufiges Verifizierungssystem
- **Begrenzte Invites**: Jeder User hat limitierte Einladungen (Standard: 5)
- **Moderation**: Admin/Mod-Kontrolle über Verifizierungen

---

## 📊 Datenbankschema

### Neue Tabellen

#### `invites`
```sql
- id (uuid, primary key)
- code (varchar(12), unique) -- 6-stelliger alphanumerischer Code
- created_by (uuid, foreign key -> profiles.id)
- used_by (uuid, nullable, foreign key -> profiles.id)
- created_at (timestamp)
- used_at (timestamp, nullable)
- expires_at (timestamp) -- standard Gültigkeit aus settings (oder custom für aktionsinvites, admins oder mods)
- is_active (boolean, default true)
- is_action_code (boolean, default false) -- Unterscheidung zu normalen Invites
- max_uses (integer, default 1) -- Mehrfachverwendung für Aktionscodes
- current_uses (integer, default 0) -- Aktuelle Verwendungen
```

#### `invite_settings`
```sql
- id (uuid, primary key)
- setting_key (varchar, unique) -- z.B. 'invite_rate_limit', 'default_validity'
- setting_value (text) -- JSON-Werte für komplexe Einstellungen
- updated_by (uuid, foreign key -> profiles.id)
- updated_at (timestamp)
```

#### `invite_attempts`
```sql
- id (uuid, primary key)
- code_attempted (varchar(6)) -- Versuchter Code
- ip_address (inet) -- IP-Adresse
- email_attempted (varchar, nullable) -- Versuchte E-Mail
- success (boolean) -- Erfolgreicher Versuch?
- attempted_at (timestamp)
- user_agent (text, nullable) -- Browser Info
```

#### `verification_requests`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> profiles.id)
- status (enum: 'pending', 'approved', 'rejected', 'needs_info')
- request_message (text) -- User Begründung
- admin_notes (text, nullable) -- Admin Notizen
- recommended_by (uuid, nullable, foreign key -> profiles.id)
- created_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewed_by (uuid, nullable, foreign key -> profiles.id)
```

### Erweiterte Tabellen

#### `profiles` (Neue Spalten)
```sql
- invite_credits (integer, default 0) -- Verfügbare Einladungen
- is_verified (boolean, default false) -- Verifizierungsstatus
- verification_level (enum: 'unverified', 'verified', 'trusted', 'moderator', 'admin')
- invited_by (uuid, nullable, foreign key -> profiles.id)
- registration_invite_code (varchar(6), nullable) -- Verwendeter Invite-Code
```

---

## 🔐 Benutzerrollen & Berechtigungen

### Rolle Hierarchie
1. **Admin** - Vollzugriff, unbegrenzte Invites
2. **Moderator** - Verifizierungen verwalten, 20 Invites
3. **Organizer** - Event-Erstellung, 10 Invites nach Verifizierung
4. **Verified User** - Basis verifiziert, 5 Invites
5. **Unverified User** - Begrenzte Funktionen, 0 Invites

### Invite-Berechtigung
- **Kann einladen:** Admin, Moderator, Organizer, Verified User
- **Kann nicht einladen:** Unverified User
- **Invite-Credits:** Je nach Rolle unterschiedlich

---

## 📝 User Journey

### 1. Registrierung (Neuer Flow)
```
Besucher -> Invite-Code eingeben (mit Info-Icon) -> Code-Validierung (Rate Limited) -> 
Backend-Freigabe -> Email/Passwort -> Account erstellt (unverified)
```

**Registrierungssperre:**
- Formular bleibt gesperrt bis gültiger Code eingegeben
- Backend-Validierung verhindert Frontend-Manipulation
- Rate Limiting: Max 5 Versuche, dann 5min Sperre

### 2. Verifizierungsantrag
```
User (≥3 Tage) -> Profil vervollständigen -> Verifizierung beantragen -> Admin Review -> Verified Status
```

### 3. Einladungen versenden
```
Verified User -> Invite-Menü -> Code generieren -> Code teilen -> Neuer User registriert
```

---

## 🎨 UI/UX Design

### Registrierungsseite (Erweitert)
```
┌─ Registrierung ─────────────────────────┐
│ Invite-Code *                           │
│ ┌─────────────┐ ℹ️                      │
│ │ ABC123      │ <- Info-Tooltip         │
│ └─────────────┘                         │
│                                         │
│ ⚠️ Verbleibende Versuche: 3/5          │
│                                         │
│ [E-Mail eingeben...] 🔒 (gesperrt)     │
│ [Passwort eingeben...] 🔒 (gesperrt)   │
│                                         │
│ [Registrieren] 🔒 (gesperrt)           │
└─────────────────────────────────────────┘

Info-Tooltip Inhalt:
"RaveTracker ist eine invite-basierte Community.
Du benötigst einen 6-stelligen Einladungscode 
von einem verifizierten Mitglied. Codes sind 
alphanumerisch (A-Z, 0-9) und case-insensitive."
```

- **Code-Eingabefeld** mit Echtzeit-Validierung
- **Info-Icon** mit detaillierter Erklärung
- **Gesperrte Felder** bis gültiger Code eingegeben
- **Rate-Limit Anzeige** für verbleibende Versuche
- **Benutzerfreundliche Fehlermeldungen**

### Verifizierungsbereich (Profil/Einstellungen)
```
┌─ Seriösität bestätigen ─────────────────┐
│ Status: ⚠️ Unverifiziert                │
│                                         │
│ Voraussetzungen:                        │
│ ✅ E-Mail bestätigt                     │
│ ⏳ Registriert seit 2/3 Tagen          │
│ ❌ Profil vervollständigen              │
│                                         │
│ [Verifizierung beantragen]              │
└─────────────────────────────────────────┘
```

### Invite-Management (Erweitert)
```
┌─ Einladungen verwalten ─────────────────┐
│ Verfügbare Einladungen: 3/5             │
│                                         │
│ [+ Neue Einladung erstellen]            │
│                                         │
│ Aktive Einladungen:                     │
│ ├─ ABC123 (erstellt: 15.07.2025)       │
│ │  ⏰ Läuft ab in: 28 Tagen            │
│ │  Status: Unbenutzt [🗑️ Löschen]      │
│ └─ XYZ789 (erstellt: 10.07.2025)       │
│    Status: Verwendet von @max_müller    │
│                                         │
│ Abgelaufene Einladungen:                │
│ └─ DEF456 (abgelaufen: 20.07.2025)     │
│    💔 Credit nicht zurückerstattet     │
└─────────────────────────────────────────┘

Benachrichtigungen:
🔔 "Einladung ABC123 läuft in 2 Tagen ab"
🔔 "Einladung XYZ789 läuft morgen ab"
```

**Wichtige Regeln:**
- **Abgelaufene Invites:** Credit bleibt verloren
- **Gelöschte unbenutzten Invites:** Credit wird zurückerstattet  
- **Automatische Benachrichtigungen:** 2 Tage und 1 Tag vor Ablauf

### User Dropdown Erweiterung
```
Für berechtigte User:
┌─ Benutzermenu ────────┐
│ 👤 Profil             │
│ ⚙️ Einstellungen      │
│ ➕ Einladen           │ <- NEU
│ 🚪 Abmelden           │
└───────────────────────┘
```

---

## 🛠️ Admin/Moderator Tools

### Invite Manager (Neue Admin-Seite)
```
/admin/invites

Tabs:
├─ Verifizierungsanträge
├─ Invite-Codes verwalten  
├─ Aktionscodes (Admin Only)
├─ System-Einstellungen (Admin Only)
├─ Benutzer-Credits
├─ Fehlversuche-Log
└─ System-Statistiken
```

### Verifizierungsanträge
```
┌─ Antrag #12 ─────────────────────────────┐
│ User: @techno_lover (seit 5 Tagen)      │
│ Email: ✅ Bestätigt                      │
│ Empfohlen von: @established_user         │
│                                          │
│ Begründung:                              │
│ "Ich organisiere seit 3 Jahren Events   │
│  in Berlin und möchte die Community     │
│  unterstützen..."                       │
│                                          │
│ [✅ Genehmigen] [❌ Ablehnen]           │
│ [💬 Mehr Infos anfordern]               │
└──────────────────────────────────────────┘
```

### Fehlversuche-Log (Admin Only)
```
┌─ Invite-Code Fehlversuche ──────────────┐
│ 🔍 Filter: [Letzte 24h ▼] [Alle IPs ▼] │
│                                         │
│ 2025-07-24 15:30:22 | 192.168.1.100    │
│ Code: "FAKE123" | Email: test@test.com  │
│ User-Agent: Chrome/Safari...            │
│ Status: ❌ Ungültiger Code              │
│ ──────────────────────────────────────  │
│ 2025-07-24 15:25:15 | 192.168.1.100    │
│ Code: "WRONG1" | Email: test@test.com   │
│ Status: ❌ Code nicht gefunden          │
│ [🚫 IP sperren] [📧 Email markieren]   │
│                                         │
│ Verdächtige Aktivitäten:                │
│ ⚠️ IP 192.168.1.100: 5 Fehlversuche    │
│ ⚠️ Email test@test.com: 3 verschiedene  │
│    Codes probiert                       │
└─────────────────────────────────────────┘
```

### Benutzerverwaltung (Erweitert)
```
User: @techno_lover
├─ Rolle: Verified User
├─ Invite-Credits: 3/5 [Bearbeiten]
├─ Eingeladen von: @established_user  
├─ Hat eingeladen: 2 Benutzer
├─ Registriert mit Code: WELCOME25
└─ Verifiziert am: 20.07.2025
```

### Aktionscodes (Admin Only)
```
┌─ Aktionscodes verwalten ────────────────┐
│ [➕ Neuen Aktionscode erstellen]        │
│                                         │
│ Code-Erstellung:                        │
│ ┌─────────────────────────────────────┐ │
│ │ Code: [WELCOME25] oder [🎲 Zufällig]│ │
│ │ Gültigkeit: [30] Tage / [6] Monate  │ │
│ │ Max. Verwendungen: [100]            │ │
│ │ Erstellt für: Event/Kampagne XYZ    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Aktive Aktionscodes:                    │
│ ├─ WELCOME25 (25/100 verwendet)        │
│ │  📅 Läuft ab: 01.09.2025            │
│ │  [📊 Details] [⏸️ Deaktivieren]     │
│ │                                     │
│ └─ SUMMER2025 (50/250 verwendet)       │
│    📅 Läuft ab: 31.08.2025            │
│    [📊 Details] [⏸️ Deaktivieren]     │
└─────────────────────────────────────────┘
```

**Features:**
- **Custom Codes:** Frei wählbare oder zufällige Generierung
- **Mehrfachverwendung:** Bis zu eingestelltem Limit
- **Flexible Gültigkeit:** Tage oder Monate wählbar
- **Verwendungsstatistiken:** Real-time Tracking

---

## ⚙️ Technische Implementierung

### Backend Services

#### InviteService (Erweitert)
```typescript
class InviteService {
  // Normale User-Invites
  generateCode(): string // 6-stelliger Code
  createInvite(userId: string): Promise<Invite>
  validateCode(code: string): Promise<ValidationResult>
  useInvite(code: string, newUserId: string): Promise<void>
  getUserInvites(userId: string): Promise<Invite[]>
  deleteUnusedInvite(inviteId: string): Promise<void>
  
  // Aktionscodes (Admin)
  createActionCode(params: ActionCodeParams): Promise<ActionInvite>
  validateActionCode(code: string): Promise<ValidationResult>
  getActionCodeStats(codeId: string): Promise<ActionCodeStats>
  deactivateActionCode(codeId: string): Promise<void>
  
  // Ablauf-Management
  scheduleExpiryNotifications(): Promise<void>
  cleanupExpiredCodes(): Promise<void>
  restoreCredit(userId: string, amount: number): Promise<void>
}

interface ValidationResult {
  isValid: boolean
  isActionCode: boolean
  remainingUses?: number
  expiresAt: Date
  rateLimitInfo: RateLimitInfo
}

interface RateLimitInfo {
  attemptsRemaining: number
  timeUntilReset: number
  isBlocked: boolean
}
```

#### VerificationService
```typescript
class VerificationService {
  checkEligibility(userId: string): Promise<EligibilityStatus>
  submitRequest(userId: string, message: string): Promise<void>
  reviewRequest(requestId: string, decision: string): Promise<void>
  grantVerification(userId: string): Promise<void>
}
```

#### UserService (Erweitert)
```typescript
class UserService {
  updateInviteCredits(userId: string, credits: number): Promise<void>
  getInviteStats(userId: string): Promise<InviteStats>
  canInvite(userId: string): Promise<boolean>
  
  // Neuer Service für Rate Limiting
  checkRateLimit(ip: string, email?: string): Promise<RateLimitStatus>
  logInviteAttempt(attempt: InviteAttempt): Promise<void>
  blockIP(ip: string, duration: number): Promise<void>
}

class AdminSettingsService {
  getSettings(): Promise<AdminSettings>
  updateSetting(key: string, value: any): Promise<void>
  getRolePermissions(): Promise<RolePermissions>
  updateRolePermissions(permissions: RolePermissions): Promise<void>
}

class NotificationService {
  scheduleExpiryNotifications(): Promise<void>
  sendExpiryWarning(userId: string, inviteCode: string, daysLeft: number): Promise<void>
  sendCreditRestoredNotification(userId: string): Promise<void>
}
```

### Frontend Components

#### Neue Komponenten
- `InviteCodeInput.svelte` - Registrierung mit Rate Limiting
- `InviteInfoTooltip.svelte` - Informations-Popup  
- `VerificationRequest.svelte` - Verifizierungsantrag
- `InviteManager.svelte` - User Invite-Verwaltung
- `AdminInvitePanel.svelte` - Admin-Interface
- `ActionCodeManager.svelte` - Aktionscode-Verwaltung
- `AdminSettings.svelte` - System-Einstellungen
- `InviteAttemptsLog.svelte` - Fehlversuche-Protokoll
- `VerificationBadge.svelte` - Status-Anzeige
- `ExpiryNotification.svelte` - Ablauf-Benachrichtigungen

### Middleware & Guards
- `AuthGuard` - Nur verified users für bestimmte Features
- `InviteGuard` - Registrierung nur mit Code
- `AdminGuard` - Admin/Mod Bereiche

---

## 🔒 Sicherheit & Validierung

### Code-Generierung
- **Kryptographisch sicher** (crypto.randomBytes)
- **Kollisionsprüfung** vor Speicherung
- **Blacklist** für problematische Kombinationen (z.B. "HITLER")

### Rate Limiting
- **Invite-Erstellung:** Max 1 pro Stunde pro User
- **Verifizierungsanträge:** Max 1 pro 30 Tage
- **Code-Validierung:** Max 10 Versuche pro IP/Stunde

### Spam-Schutz
- **Email-Verifikation** vor Verifizierungsantrag
- **Account-Alter** Mindestanforderung (3 Tage)
- **IP-Tracking** für Invite-Missbrauch

---

## 📈 Analytics & Monitoring

### Metriken
- **Invite-Conversion-Rate** (Code → Registrierung)
- **Verifizierungs-Success-Rate** (Antrag → Approval)
- **Community-Wachstum** (Invites → Aktive User)
- **User-Engagement** nach Verifizierung

### Dashboards
- **Admin:** Globale Invite-Statistiken
- **User:** Persönliche Invite-Performance
- **Moderator:** Verifizierungs-Queue-Status

---

## 🚀 Rollout-Strategie

### Phase 1: Foundation (Woche 1-2)
- [ ] Datenbankschema erstellen (inkl. neue Tabellen)
- [ ] Backend Services implementieren (Rate Limiting)
- [ ] Basis-UI Components mit Info-Tooltips

### Phase 2: Core Features (Woche 3-4)
- [ ] Registrierung mit Invite-Code (Backend-Enforcement)
- [ ] Rate Limiting System implementieren
- [ ] Verifizierungssystem
- [ ] User Invite-Management mit Ablauf-Logic

### Phase 3: Admin Tools (Woche 5-6)
- [ ] Admin Invite Manager (erweitert)
- [ ] Aktionscode-System komplett
- [ ] Admin-Einstellungen Interface
- [ ] Fehlversuche-Logging & Monitoring
- [ ] Verifizierungs-Review Interface

### Phase 4: Advanced Features (Woche 7-8)
- [ ] Benachrichtigungssystem (Ablauf-Warnungen)
- [ ] Credit-Management (Wiederherstellung)
- [ ] Security Dashboard
- [ ] User Credit Management (Admin)

### Phase 5: Polish & Launch (Woche 9-10)
- [ ] UI/UX Optimierungen
- [ ] Comprehensive Testing (Rate Limits, Security)
- [ ] Performance Optimierung
- [ ] Dokumentation & Admin-Schulung

---

## 🎯 Success Metrics

### Kurzfristig (1-3 Monate)
- **50%** der neuen Registrierungen über Invites
- **80%** Verifizierungs-Approval-Rate
- **< 5%** Spam/Fake-Accounts

### Langfristig (6-12 Monate)
- **90%** Community-Mitglieder verified
- **Höhere Event-Qualität** durch kuratierte User
- **Stärkere Community-Bindung** durch Empfehlungssystem

---

## 🔧 Maintenance & Support

### Regelmäßige Tasks (Erweitert)
- **Abgelaufene Codes löschen** (täglich)
- **Ablauf-Benachrichtigungen versenden** (täglich)
- **Rate-Limit-Sperren aufheben** (stündlich)
- **Fehlversuche-Log bereinigen** (wöchentlich, >30 Tage)
- **Aktionscode-Performance analysieren** (wöchentlich)
- **Verifizierungs-Queue reviewen** (täglich)
- **Invite-Statistiken analysieren** (wöchentlich)
- **Security-Anomalien prüfen** (täglich)
- **User-Feedback einsammeln** (monatlich)

### Support-Workflows (Erweitert)
- **Invite-Code Probleme** → Rate-Limit-Check → FAQ + Admin-Hilfe
- **"Code funktioniert nicht"** → Ablauf-Check → Neuen Code anfordern
- **Verifizierungs-Verzögerung** → Moderator-Escalation → Status-Update
- **Account-Sperrung** → Appeal-Prozess → Admin-Review
- **Fehlende Credits** → Transaction-Log → Manuelle Wiederherstellung
- **Aktionscode-Missbrauch** → IP-Analyse → Preventive Maßnahmen

---

## 💡 Zukünftige Erweiterungen

### Advanced Features
- **Invite-Chains** - Genealogie-Tracking
- **Reputation-System** - Basierend auf eingeladenen Usern
- **Seasonal-Invites** - Event-basierte Bonus-Credits
- **VIP-Invites** - Sofort-Verifizierung für Trusted User

### Integration Möglichkeiten
- **Social Media** - Invite-Sharing Tools
- **Email Marketing** - Automated Invite-Campaigns
- **Event-Integration** - Invites für spezielle Events
- **Partner-APIs** - Cross-Platform Invite-System

---

*Diese Spezifikation dient als Grundlage für die Implementierung des Invite-Systems und sollte regelmäßig basierend auf User-Feedback und technischen Erkenntnissen aktualisiert werden.*
