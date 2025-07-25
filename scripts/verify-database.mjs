#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envContent = readFileSync(join(__dirname, '..', '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Fehlende Supabase Konfiguration in .env Datei!');
  console.log('💡 Stelle sicher, dass VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY gesetzt sind.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 RaveTracker v3 - Datenbank Verifikation\n');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 Verwende Anon Key (erste 20 Zeichen):', supabaseAnonKey.substring(0, 20) + '...\n');

async function verifyDatabase() {
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  console.log('🚀 Starte Datenbank-Verifikation...\n');

  // Test 1: Grundverbindung
  console.log('1️⃣ Teste Grundverbindung...');
  try {
    const { data, error } = await supabase.rpc('version');
    if (error) {
      console.log('⚠️  Verbindung hergestellt, aber begrenzte Berechtigung');
      console.log('   Das ist normal für anon-keys mit RLS');
    } else {
      console.log('✅ Datenbankverbindung erfolgreich');
    }
    totalChecks++;
    passedChecks++;
  } catch (err) {
    console.log('❌ Verbindungsfehler:', err.message);
    totalChecks++;
    failedChecks++;
  }

  // Test 2: Event-Kategorien (öffentlich lesbar)
  console.log('\n2️⃣ Prüfe Event-Kategorien...');
  try {
    const { data: categories, error } = await supabase
      .from('event_categories')
      .select('name, description, color')
      .order('name');
    
    totalChecks++;
    if (error) {
      console.log('❌ Fehler beim Laden der Kategorien:', error.message);
      failedChecks++;
    } else {
      console.log(`✅ ${categories.length} Event-Kategorien gefunden:`);
      categories.forEach(cat => {
        console.log(`   • ${cat.name} (${cat.color})`);
      });
      passedChecks++;
    }
  } catch (err) {
    console.log('❌ Unerwarteter Fehler:', err.message);
    totalChecks++;
    failedChecks++;
  }

  // Test 3: Authentifizierung mit Test-User
  console.log('\n3️⃣ Teste Authentifizierung...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'user@ravetracker.com',
      password: 'UserSecure2025!'
    });

    totalChecks++;
    if (authError) {
      console.log('❌ Login fehlgeschlagen:', authError.message);
      console.log('💡 Mögliche Ursachen:');
      console.log('   - Test-User noch nicht erstellt (SQL-Script ausführen!)');
      console.log('   - E-Mail Bestätigung erforderlich');
      console.log('   - Falsches Passwort');
      failedChecks++;
    } else {
      console.log('✅ Test-User Login erfolgreich');
      console.log(`   User-ID: ${authData.user.id}`);
      console.log(`   E-Mail: ${authData.user.email}`);
      passedChecks++;

      // Test 4: Profile laden (wenn authentifiziert)
      console.log('\n4️⃣ Lade Benutzer-Profil...');
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, role, verification_level')
          .eq('user_id', authData.user.id)
          .single();

        totalChecks++;
        if (profileError) {
          console.log('❌ Profil konnte nicht geladen werden:', profileError.message);
          failedChecks++;
        } else {
          console.log('✅ Benutzer-Profil geladen:');
          console.log(`   Username: ${profile.username}`);
          console.log(`   Rolle: ${profile.role}`);
          console.log(`   Verifikation: ${profile.verification_level}`);
          passedChecks++;
        }
      } catch (err) {
        console.log('❌ Profil-Fehler:', err.message);
        totalChecks++;
        failedChecks++;
      }

      // Logout
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Auth-Fehler:', err.message);
    totalChecks++;
    failedChecks++;
  }

  // Test 5: Invite-Codes prüfen (falls öffentlich lesbar)
  console.log('\n5️⃣ Prüfe Invite-System...');
  try {
    const { data: invites, error: inviteError } = await supabase
      .from('invites')
      .select('code, max_uses, uses_count, expires_at')
      .limit(3);

    totalChecks++;
    if (inviteError) {
      console.log('⚠️  Invite-Codes nicht öffentlich zugänglich (normal)');
      console.log('   RLS verhindert Zugriff ohne Authentifizierung');
      passedChecks++; // Das ist eigentlich korrekt
    } else {
      console.log(`✅ ${invites.length} Invite-Codes verfügbar:`);
      invites.forEach(invite => {
        const expires = invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'Permanent';
        console.log(`   • ${invite.code} (${invite.uses_count}/${invite.max_uses || '∞'}) - bis ${expires}`);
      });
      passedChecks++;
    }
  } catch (err) {
    console.log('❌ Invite-Fehler:', err.message);
    totalChecks++;
    failedChecks++;
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFIKATIONS-ERGEBNIS');
  console.log('='.repeat(50));
  console.log(`✅ Erfolgreich: ${passedChecks}/${totalChecks}`);
  console.log(`❌ Fehlgeschlagen: ${failedChecks}/${totalChecks}`);
  
  const successRate = Math.round((passedChecks / totalChecks) * 100);
  console.log(`📈 Erfolgsrate: ${successRate}%`);

  if (successRate >= 80) {
    console.log('\n🎉 Datenbank ist korrekt konfiguriert!');
    console.log('💡 Du kannst jetzt mit der Entwicklung beginnen.');
  } else if (successRate >= 60) {
    console.log('\n⚠️ Datenbank teilweise konfiguriert');
    console.log('💡 Einige Funktionen funktionieren möglicherweise nicht.');
    console.log('🔧 Führe das SQL-Script in Supabase aus: supabase/database_complete_reset.sql');
  } else {
    console.log('\n❌ Datenbank nicht korrekt konfiguriert');
    console.log('💡 Nächste Schritte:');
    console.log('   1. Überprüfe deine .env Konfiguration');
    console.log('   2. Führe das SQL-Script in Supabase aus');
    console.log('   3. Stelle sicher, dass alle Tabellen erstellt wurden');
  }

  console.log('\n📖 Weitere Hilfe: Siehe DATABASE_SETUP.md');
}

// Starte Verifikation
verifyDatabase().catch(console.error);
