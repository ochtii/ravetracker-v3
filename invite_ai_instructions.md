# Invite System Implementation - AI Instructions für Claude Sonnet 4

## 🎯 Überblick
Diese Anleitung enthält präzise Schritt-für-Schritt Prompts für Claude Sonnet 4, um das Invite-System nahtlos in RaveTracker v3 zu integrieren. Jeder Prompt baut auf dem vorherigen auf und enthält spezifische Implementierungsdetails.

---

## 📋 Voraussetzungen vor Start

**Prompt 0 - Projektanalyse:**
```
Analysiere die aktuelle RaveTracker v3 Codebase:
1. Führe eine vollständige Projektstruktur-Analyse durch
2. Identifiziere das aktuelle Authentifizierungssystem (Supabase)
3. Dokumentiere die bestehenden Database-Schemas (profiles, events, etc.)
4. Analysiere die aktuelle SvelteKit-Architektur und Routing-Struktur
5. Prüfe die vorhandenen Admin-Tools und deren Zugriffskontrolle
6. Erstelle eine Übersicht der aktuellen UI-Components

Ausgabe: Detaillierte Projektanalyse mit Empfehlungen für die Integration.
```

---

## 🏗️ Phase 1: Database Foundation (Woche 1-2)

### Schritt 1.1 - Datenbankschema erstellen

**Prompt 1.1:**
```
Erstelle die Supabase-Datenbank-Migration für das Invite-System mit folgenden Tabellen:

1. `invites` Tabelle:
- id (uuid, primary key)
- code (varchar(12), unique, 6-stelliger alphanumerischer Code)
- created_by (uuid, foreign key -> profiles.id)
- used_by (uuid, nullable, foreign key -> profiles.id)
- created_at (timestamp)
- used_at (timestamp, nullable)
- expires_at (timestamp)
- is_active (boolean, default true)
- is_action_code (boolean, default false)
- max_uses (integer, default 1)
- current_uses (integer, default 0)

2. `invite_settings` Tabelle:
- id (uuid, primary key)
- setting_key (varchar, unique)
- setting_value (text)
- updated_by (uuid, foreign key -> profiles.id)
- updated_at (timestamp)

3. `invite_attempts` Tabelle:
- id (uuid, primary key)
- code_attempted (varchar(6))
- ip_address (inet)
- email_attempted (varchar, nullable)
- success (boolean)
- attempted_at (timestamp)
- user_agent (text, nullable)

4. `verification_requests` Tabelle:
- id (uuid, primary key)
- user_id (uuid, foreign key -> profiles.id)
- status (enum: 'pending', 'approved', 'rejected', 'needs_info')
- request_message (text)
- admin_notes (text, nullable)
- recommended_by (uuid, nullable, foreign key -> profiles.id)
- created_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewed_by (uuid, nullable, foreign key -> profiles.id)

5. Erweitere `profiles` Tabelle um:
- invite_credits (integer, default 0)
- is_verified (boolean, default false)
- verification_level (enum: 'unverified', 'verified', 'trusted', 'moderator', 'admin')
- invited_by (uuid, nullable, foreign key -> profiles.id)
- registration_invite_code (varchar(6), nullable)

Erstelle auch die entsprechenden RLS Policies für Sicherheit.
Datei: `supabase/migrations/invite_system_schema.sql`
```

### Schritt 1.2 - Basis-Konfiguration

**Prompt 1.2:**
```
Erstelle die initiale Konfiguration für das Invite-System:

1. Default-Einstellungen in `invite_settings` einfügen:
- 'invite_rate_limit': '{"per_hour": 1, "per_day": 5}'
- 'default_validity_days': '30'
- 'verification_cooldown_days': '30'
- 'min_account_age_days': '3'
- 'default_invite_credits': '{"verified": 5, "trusted": 10, "moderator": 20}'

2. Erstelle ein Seed-Script für Admin-Accounts mit entsprechenden Credits

3. Erstelle TypeScript-Interfaces für alle neuen Datenstrukturen
Datei: `src/lib/types/invite.ts`

Implementiere robuste Error-Handling für alle Database-Operationen.
```

---

## 🔧 Phase 2: Backend Services (Woche 3-4)

### Schritt 2.1 - InviteService implementieren

**Prompt 2.1:**
```
Erstelle den InviteService mit folgenden Funktionen:

```typescript
class InviteService {
  // Code-Generierung mit kryptographischer Sicherheit
  generateCode(): string // 6-stelliger alphanumerischer Code
  validateCodeFormat(code: string): boolean
  checkCodeCollision(code: string): Promise<boolean>
  
  // Standard User-Invites
  createInvite(userId: string): Promise<Invite>
  validateCode(code: string, ip: string): Promise<ValidationResult>
  useInvite(code: string, newUserId: string): Promise<void>
  getUserInvites(userId: string): Promise<Invite[]>
  deleteUnusedInvite(inviteId: string, userId: string): Promise<void>
  
  // Credit-Management
  restoreInviteCredit(userId: string): Promise<void>
  updateUserCredits(userId: string, amount: number): Promise<void>
  getUserInviteStats(userId: string): Promise<InviteStats>
}
```

Wichtige Features:
- Rate Limiting (max 1 Invite/Stunde pro User)
- Automatic Expiry (30 Tage Standard)
- Code-Blacklist für problematische Kombinationen
- Comprehensive Logging aller Aktionen

Datei: `src/lib/services/invite-service.ts`
```

### Schritt 2.2 - Rate Limiting System

**Prompt 2.2:**
```
Implementiere ein robustes Rate Limiting System:

1. RateLimitService:
```typescript
class RateLimitService {
  checkInviteCreationLimit(userId: string): Promise<RateLimitResult>
  checkCodeValidationLimit(ip: string, email?: string): Promise<RateLimitResult>
  logAttempt(type: 'invite_creation' | 'code_validation', identifier: string): Promise<void>
  isBlocked(identifier: string): Promise<boolean>
  blockIP(ip: string, duration: number): Promise<void>
}
```

2. Implementiere IP-basiertes und User-basiertes Rate Limiting
3. Automatische Sperrung bei verdächtigen Aktivitäten
4. Admin-Tools zum Entsperren von IPs/Users

Datei: `src/lib/services/rate-limit-service.ts`

Integriere das System in alle Invite-relevanten Endpoints.
```

### Schritt 2.3 - Verification System

**Prompt 2.3:**
```
Erstelle das Verifizierungssystem:

```typescript
class VerificationService {
  checkEligibility(userId: string): Promise<EligibilityStatus>
  submitVerificationRequest(userId: string, message: string): Promise<VerificationRequest>
  getVerificationRequest(userId: string): Promise<VerificationRequest | null>
  getPendingRequests(): Promise<VerificationRequest[]>
  reviewRequest(requestId: string, decision: 'approved' | 'rejected' | 'needs_info', adminId: string, notes?: string): Promise<void>
  grantVerification(userId: string, level: VerificationLevel): Promise<void>
}
```

Implementiere:
- Eligibility-Checks (Account-Alter, Email-Verifizierung)
- Admin/Moderator Review-Interface
- Automatic Credit-Assignment bei Verifizierung
- Notification-System für Status-Updates

Datei: `src/lib/services/verification-service.ts`
```

---

## 🎨 Phase 3: Frontend Components (Woche 5-6)

### Schritt 3.1 - Registrierungsseite erweitern

**Prompt 3.1:**
```
Erweitere die bestehende Registrierungsseite um das Invite-Code System:

1. InviteCodeInput Component:
- Gesperrtes Formular bis gültiger Code eingegeben
- Real-time Code-Validierung mit Backend
- Rate-Limit Anzeige (Verbleibende Versuche)
- Info-Tooltip mit detaillierter Erklärung
- Benutzerfreundliche Fehlermeldungen

2. UI-Features:
- Visuelles Feedback für Code-Validierung
- Progressive Enhancement (funktioniert auch ohne JS)
- Responsive Design für Mobile
- Accessibility-Features (ARIA, Keyboard-Navigation)

3. Backend-Integration:
- Server-side Validierung verhindert Frontend-Manipulation
- Session-basiertes Rate Limiting
- Sichere Code-Übertragung

Dateien:
- `src/lib/components/InviteCodeInput.svelte`
- `src/lib/components/InviteInfoTooltip.svelte`
- `src/routes/register/+page.svelte` (erweitern)
- `src/routes/register/+page.server.ts` (erweitern)
```

### Schritt 3.2 - User Invite Management

**Prompt 3.2:**
```
Erstelle das User Invite-Management Interface:

1. InviteManager Component:
- Anzeige verfügbarer Credits
- Liste aktiver/verwendeter/abgelaufener Invites
- Invite-Erstellung mit One-Click
- Delete-Funktion für unbenutzte Codes (Credit-Rückerstattung)
- Ablauf-Warnungen und Benachrichtigungen

2. Features:
- Real-time Updates der Invite-Status
- Copy-to-Clipboard für Invite-Codes
- Share-Funktionen (Email, Social Media)
- Statistiken (Conversion-Rate, etc.)

3. Integration:
- Nahtlose Integration in User-Profile/Settings
- Mobile-optimierte Darstellung
- Dark/Light Mode Support

Dateien:
- `src/lib/components/InviteManager.svelte`
- `src/lib/components/InviteCard.svelte`
- `src/routes/profile/invites/+page.svelte`
- `src/routes/profile/invites/+page.server.ts`
```

### Schritt 3.3 - Verification Interface

**Prompt 3.3:**
```
Implementiere das Verifizierungs-Interface:

1. VerificationRequest Component:
- Eligibility-Check mit visuellen Status-Indikatoren
- Textfeld für Begründung (mit Zeichenlimit)
- Upload-Funktion für zusätzliche Nachweise
- Status-Tracking des Antrags

2. VerificationBadge Component:
- Sichtbare Verification-Level in User-Profilen
- Tooltips mit Erklärung der verschiedenen Level
- Integration in alle User-Listen/Cards

3. Admin Review Interface:
- Übersichtliche Antragsliste mit Filtering
- One-Click Approve/Reject Buttons
- Notizen-System für Admin-Kommunikation
- Bulk-Actions für effiziente Bearbeitung

Dateien:
- `src/lib/components/VerificationRequest.svelte`
- `src/lib/components/VerificationBadge.svelte`
- `src/routes/verify/+page.svelte`
- `src/routes/admin/verification/+page.svelte`
```

---

## 🛠️ Phase 4: Admin Tools (Woche 7-8)

### Schritt 4.1 - Admin Invite Dashboard

**Prompt 4.1:**
```
Erstelle das umfassende Admin Invite Dashboard:

1. Hauptübersicht:
- System-weite Invite-Statistiken
- Aktive/Verwendete/Abgelaufene Codes Übersicht
- Conversion-Rate Tracking
- Verdächtige Aktivitäten Alerts

2. Benutzer-Management:
- Liste aller User mit Invite-Credits
- Möglichkeit zur manuellen Credit-Anpassung
- Invite-Chain Visualisierung (Wer hat wen eingeladen)
- Bulk-Operations für Credit-Updates

3. Code-Management:
- Suche nach spezifischen Invite-Codes
- Deaktivierung problematischer Codes
- Wiederherstellung von Credits bei Missbrauch

Dateien:
- `src/routes/admin/invites/+page.svelte`
- `src/routes/admin/invites/stats/+page.svelte`
- `src/routes/admin/invites/users/+page.svelte`
- `src/lib/components/admin/InviteStatsCard.svelte`
```

### Schritt 4.2 - Aktionscode-System

**Prompt 4.2:**
```
Implementiere das Admin-only Aktionscode-System:

1. ActionCodeManager:
- Erstellung von Mehrfach-verwendbaren Codes
- Custom Code-Namen oder Zufallsgenerierung
- Flexible Gültigkeitsdauer (Tage/Monate)
- Verwendungslimit-Einstellung

2. Überwachung & Analytics:
- Real-time Nutzungsstatistiken
- Erfolgreiche Registrierungen pro Code
- Demographic-Analyse der Code-Nutzer
- ROI-Tracking für Marketing-Kampagnen

3. Code-Typen:
- Event-spezifische Codes
- Zeitlich begrenzte Kampagnen-Codes
- Partner-Codes mit besonderen Vorteilen
- Emergency-Codes für System-Issues

Dateien:
- `src/lib/components/admin/ActionCodeManager.svelte`
- `src/lib/components/admin/ActionCodeStats.svelte`
- `src/routes/admin/invites/action-codes/+page.svelte`
- `src/lib/services/action-code-service.ts`
```

### Schritt 4.3 - Security Dashboard

**Prompt 4.3:**
```
Erstelle das Security & Monitoring Dashboard:

1. Fehlversuche-Log:
- Real-time Log aller Code-Validierung-Versuche
- IP-basierte Anomalie-Erkennung
- Verdächtige Pattern-Erkennung (gleiche Email, etc.)
- Automatische Sperrung bei Threshold-Überschreitung

2. Admin-Tools:
- Manual IP-Blocking/Unblocking
- Email-Blacklisting
- Rate-Limit Anpassungen
- Emergency-System-Sperrung

3. Reporting:
- Wöchentliche Security-Reports
- Threat-Level Einschätzungen  
- False-Positive Analyse
- System-Performance Metriken

Dateien:
- `src/routes/admin/security/+page.svelte`
- `src/lib/components/admin/SecurityLog.svelte`
- `src/lib/components/admin/ThreatIndicator.svelte`
- `src/lib/services/security-service.ts`
```

---

## 📱 Phase 5: Mobile & UX Optimierung (Woche 9)

### Schritt 5.1 - Mobile Optimierung

**Prompt 5.1:**
```
Optimiere alle Invite-System Components für Mobile:

1. Responsive Design:
- Touch-optimierte Buttons und Inputs
- Swipe-Gesten für Listen-Navigation
- Optimierte Modal-Dialoge für kleine Screens
- Progressive Web App Features

2. Performance:
- Lazy Loading für große Listen
- Optimistic Updates für bessere UX
- Offline-Funktionalität für Code-Anzeige
- Reduced Motion für Accessibility

3. Mobile-spezifische Features:
- Native Share-API für Invite-Codes
- Haptic Feedback bei Aktionen
- Push-Notifications für wichtige Updates
- Optimierte Keyboard-Eingabe für Codes

Überarbeite alle bestehenden Components entsprechend.
```

### Schritt 5.2 - Notification System

**Prompt 5.2:**
```
Implementiere ein umfassendes Benachrichtigungssystem:

1. NotificationService:
```typescript
class NotificationService {
  scheduleExpiryNotifications(): Promise<void>
  sendInviteUsedNotification(inviteId: string): Promise<void>
  sendVerificationStatusUpdate(userId: string, status: string): Promise<void>
  sendCreditRestoredNotification(userId: string): Promise<void>
  sendSecurityAlert(type: string, details: any): Promise<void>
}
```

2. Notification-Typen:
- Email-Benachrichtigungen für wichtige Events
- In-App Notifications mit Action-Buttons
- Push-Notifications für kritische Updates
- Admin-Alerts für Sicherheitsprobleme

3. User-Präferenzen:
- Granulare Notification-Einstellungen
- Opt-out Möglichkeiten
- Frequenz-Kontrolle (sofort, täglich, wöchentlich)

Datei: `src/lib/services/notification-service.ts`
```

---

## 🧪 Phase 6: Testing & Qualitätssicherung (Woche 10)

### Schritt 6.1 - Unit Tests

**Prompt 6.1:**
```
Erstelle umfassende Unit Tests für alle Services:

1. InviteService Tests:
- Code-Generierung und Validierung
- Rate Limiting Logik
- Credit-Management
- Error-Handling Scenarios

2. VerificationService Tests:
- Eligibility-Checks
- Request-Processing
- Admin-Actions
- Status-Transitions

3. SecurityService Tests:
- Rate Limiting
- IP-Blocking
- Threat-Detection
- False-Positive Handling

Verwende Vitest und Testing Library. Erreiche >90% Code Coverage.

Dateien: `src/lib/services/*.test.ts`
```

### Schritt 6.2 - Integration Tests

**Prompt 6.2:**
```
Erstelle End-to-End Tests für kritische User Journeys:

1. Registration Flow:
- Kompletter Registrierungsprozess mit Invite-Code
- Rate Limiting Verhalten
- Error-Handling bei ungültigen Codes

2. Invite Management:
- Code-Erstellung und -Verwendung
- Credit-Management
- Ablauf-Behandlung

3. Admin Workflows:
- Verifizierungs-Review-Prozess
- Aktionscode-Management
- Security-Dashboard Funktionen

Verwende Playwright für Browser-Tests.

Dateien: `tests/invite-system/*.spec.ts`
```

### Schritt 6.3 - Performance Testing

**Prompt 6.3:**
```
Führe Performance-Tests durch:

1. Load Testing:
- Massenhafte Code-Validierungen
- Concurrent Invite-Erstellungen
- Database-Performance unter Last

2. Security Testing:
- Brute-Force Angriffs-Simulation
- Rate Limiting Effectiveness
- SQL-Injection Versuche

3. Optimization:
- Database-Index Optimierung
- Query-Performance Tuning
- Caching-Strategien implementieren

Erstelle Performance-Reports und Optimierungsempfehlungen.
```

---

## 🚀 Phase 7: Deployment & Launch

### Schritt 7.1 - Production Deployment

**Prompt 7.1:**
```
Bereite das System für Production-Deployment vor:

1. Environment Configuration:
- Production-spezifische Einstellungen
- Sicherheits-Konfiguration
- Monitoring-Setup

2. Database Migration:
- Sichere Migration-Strategie
- Rollback-Pläne
- Data-Validation

3. Feature Flags:
- Gradueller Rollout
- A/B Testing Setup
- Emergency Disable-Schalter

4. Monitoring:
- Logging-Konfiguration
- Error-Tracking (Sentry)
- Performance-Monitoring

Erstelle Deployment-Checkliste und Rollback-Prozeduren.
```

### Schritt 7.2 - Launch Support

**Prompt 7.2:**
```
Erstelle Launch-Support-Materialien:

1. Admin-Dokumentation:
- System-Bedienung
- Troubleshooting-Guide
- Häufige Admin-Tasks

2. User-Hilfe:
- FAQ für Invite-System
- Video-Tutorials
- Support-Kontakte

3. Monitoring Dashboard:
- Key Performance Indicators
- Health-Checks
- Alert-Konfiguration

4. Support-Workflows:
- Incident-Response Prozeduren
- User-Support-Tickets
- Bug-Report-Handling

Bereite das Team auf Go-Live vor.
```

---

## 📊 Post-Launch Optimierung

### Schritt 8.1 - Analytics Implementation

**Prompt 8.1:**
```
Nach dem Launch: Implementiere detailliertes Analytics:

1. User-Behavior Tracking:
- Invite-Conversion-Funnels
- Drop-off Points identifizieren
- User-Journey-Optimierung

2. Business Metrics:
- Community-Wachstums-Rate
- Verifikations-Success-Rate
- Invite-Engagement-Metriken

3. Technical Metrics:
- System-Performance
- Error-Rates
- Response-Times

Erstelle Dashboards für alle Stakeholder.
```

### Schritt 8.2 - Iterative Verbesserungen

**Prompt 8.2:**
```
Basierend auf Analytics und User-Feedback:

1. UX-Optimierungen:
- Interface-Verbesserungen
- Workflow-Vereinfachungen
- Mobile-Experience-Optimierung

2. Feature-Erweiterungen:
- Advanced Admin-Tools
- Erweiterte Statistiken
- Integration-Möglichkeiten

3. Performance-Optimierungen:
- Database-Tuning
- Caching-Verbesserungen
- Code-Optimierungen

Entwickle Roadmap für kontinuierliche Verbesserungen.
```

---

## 🔧 Wartung & Support

### Regelmäßige Maintenance Tasks

**Prompt M.1 - Wöchentliche Wartung:**
```
Implementiere automatisierte Wartungsaufgaben:

1. Cleanup-Scripts:
- Abgelaufene Codes löschen
- Alte Log-Einträge archivieren
- Rate-Limit-Sperren zurücksetzen

2. Health-Checks:
- Database-Performance prüfen
- Security-Anomalien analysieren
- System-Kapazitäten überwachen

3. Reporting:
- Wöchentliche Performance-Reports
- Security-Status-Updates
- User-Engagement-Statistiken

Alles als Cron-Jobs oder Scheduled Tasks einrichten.
```

**Prompt M.2 - Incident Response:**
```
Erstelle Incident-Response-Protokolle:

1. Kritische Probleme:
- System-Ausfall Prozeduren
- Security-Breach Response
- Data-Loss Recovery

2. Standard-Probleme:
- User-Support-Workflows
- Bug-Fix-Prioritäten
- Feature-Request-Handling

3. Communication:
- Status-Page Updates
- User-Communication-Templates
- Stakeholder-Benachrichtigungen

Dokumentiere alle Prozesse ausführlich.
```

---

## 💡 Tips für Claude Sonnet 4

### Wichtige Hinweise bei der Implementierung:

1. **Sicherheit first**: Jeder Schritt muss Security-Aspekte berücksichtigen
2. **User Experience**: Alle Änderungen müssen UX-friendly sein
3. **Performance**: Bei jedem Feature an Skalierbarkeit denken
4. **Testing**: Parallel zur Entwicklung testen
5. **Documentation**: Code gut dokumentieren für spätere Wartung

### Typische Fallstricke vermeiden:

1. **Rate Limiting** kann komplex werden - einfach starten
2. **Database Migrations** sorgfältig planen und testen
3. **Mobile UX** nicht als Nachgedanke behandeln
4. **Admin Tools** müssen intuitiv bedienbar sein
5. **Error Messages** müssen benutzerfreundlich sein

### Best Practices:

1. **Incremental Development**: Kleine, testbare Schritte
2. **Backward Compatibility**: Bestehende Features nicht brechen
3. **Progressive Enhancement**: System funktioniert auch bei Teilausfällen
4. **Monitoring**: Von Anfang an Logging und Monitoring einbauen
5. **Rollback Strategy**: Immer einen Plan B haben

---

## 🎯 Erfolgs-Validierung

Nach jeder Phase sollte Claude validieren:

✅ **Funktionalität**: Alle Features arbeiten wie spezifiziert
✅ **Sicherheit**: Keine Security-Vulnerabilities
✅ **Performance**: Akzeptable Response-Times
✅ **UX**: Intuitive Bedienung
✅ **Testing**: Ausreichende Test-Coverage
✅ **Documentation**: Vollständige Dokumentation

---

*Diese Anleitung bietet einen strukturierten Ansatz für die Implementierung des Invite-Systems. Jeder Prompt sollte als eigenständige Aufgabe behandelt werden, wobei die Ergebnisse des vorherigen Schritts als Input für den nächsten dienen.*
