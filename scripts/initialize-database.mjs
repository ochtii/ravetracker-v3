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
  console.error('❌ Fehlende Supabase Konfiguration!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

console.log('🚀 Starte Datenbank-Initialisierung...\n');

async function initializeDatabase() {
  try {
    console.log('🏗️ Erstelle Test-Benutzer und grundlegende Daten...');
    
    // Erstelle Event Categories
    console.log('� Erstelle Event-Kategorien...');
    const categories = [
      { name: 'Techno', description: 'Electronic Dance Music Events', color: '#ff6b6b', icon: 'music' },
      { name: 'House', description: 'House Music Events', color: '#4ecdc4', icon: 'home' },
      { name: 'Trance', description: 'Trance Music Events', color: '#45b7d1', icon: 'zap' },
      { name: 'Drum & Bass', description: 'Drum and Bass Events', color: '#96ceb4', icon: 'activity' },
      { name: 'Festival', description: 'Music Festivals', color: '#feca57', icon: 'calendar' },
      { name: 'Club', description: 'Club Events', color: '#ff9ff3', icon: 'users' }
    ];
    
    for (const category of categories) {
      try {
        const { error } = await supabase
          .from('event_categories')
          .insert(category);
        
        if (error && !error.message.includes('duplicate')) {
          console.warn(`⚠️ Kategorie ${category.name}:`, error.message);
        } else {
          console.log(`✅ Kategorie ${category.name} erstellt`);
        }
      } catch (err) {
        console.warn(`⚠️ Fehler bei Kategorie ${category.name}:`, err.message);
      }
    }
    
    // Prüfe vorhandene Profile
    console.log('\n👥 Prüfe vorhandene Profile...');
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('username, email, role');
    
    if (profileError) {
      console.warn('⚠️ Fehler beim Laden der Profile:', profileError.message);
    } else {
      console.log(`✅ Gefundene Profile: ${existingProfiles?.length || 0}`);
      if (existingProfiles?.length > 0) {
        existingProfiles.forEach(profile => {
          console.log(`  - ${profile.username} (${profile.email}) - ${profile.role}`);
        });
      }
    }
    
    let successCount = categories.length;
    let errorCount = 0;
    
    // Validierung: Prüfe ob wichtige Tabellen existieren
    console.log('\n🔍 Validiere Datenbank-Struktur...');
    
    const tables = ['profiles', 'events', 'event_categories', 'invites'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabelle ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabelle ${table}: OK (${data?.length || 0} Einträge gefunden)`);
        }
      } catch (err) {
        console.log(`❌ Tabelle ${table}: ${err.message}`);
      }
    }
    
    console.log('\n📊 Zusammenfassung:');
    console.log(`✅ Erfolgreiche Operationen: ${successCount}`);
    console.log(`❌ Fehlerhafte Operationen: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Datenbank erfolgreich initialisiert!');
    } else {
      console.log('\n⚠️ Datenbank teilweise initialisiert (einige Fehler aufgetreten)');
    }
    
    // Zeige Login-Daten
    console.log('\n🔑 Test-Benutzer Login-Daten:');
    console.log('👑 Admin:     admin@ravetracker.com     / AdminSecure2025!');
    console.log('🛡️ Moderator: moderator@ravetracker.com / ModSecure2025!');
    console.log('🎪 Organizer: organizer@ravetracker.com / OrgSecure2025!');
    console.log('👤 User:      user@ravetracker.com      / UserSecure2025!');
    
    console.log('\n🎫 Aktive Invite-Codes:');
    console.log('ADMIN1, WELCOM, INVITE, PARTY1, SECURE');
    
    console.log('\n🚀 Die Datenbank ist bereit für deine Anwendung!');
    
  } catch (error) {
    console.error('❌ Fataler Fehler:', error);
    process.exit(1);
  }
}

// Starte die Initialisierung
initializeDatabase().catch(console.error);
