#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

console.log('🔄 RaveTracker v3 - Supabase Neukonfiguration\n');

async function setupNewSupabase() {
  try {
    // Schritt 1: Backup der aktuellen .env
    const envPath = join(__dirname, '..', '.env');
    const backupPath = join(__dirname, '..', '.env.backup');
    
    if (existsSync(envPath)) {
      const currentEnv = readFileSync(envPath, 'utf8');
      writeFileSync(backupPath, currentEnv);
      console.log('✅ Backup der aktuellen .env erstellt: .env.backup\n');
    }

    // Schritt 2: Neue Supabase Daten abfragen
    console.log('📝 Bitte gib die Daten deines NEUEN Supabase Projekts ein:\n');
    
    const projectUrl = await question('🔗 Project URL (https://xyz.supabase.co): ');
    const anonKey = await question('🔑 Anon Key: ');
    const serviceKey = await question('🔐 Service Role Key (optional, Enter für skip): ');
    
    // Project ID aus URL extrahieren
    const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
    
    console.log('\n🔍 Validiere Eingaben...');
    
    // Validierung
    if (!projectUrl.includes('supabase.co')) {
      throw new Error('❌ Ungültige Project URL. Format: https://xyz.supabase.co');
    }
    
    if (!anonKey.startsWith('eyJ')) {
      throw new Error('❌ Ungültiger Anon Key. Sollte mit "eyJ" beginnen.');
    }
    
    if (serviceKey && !serviceKey.startsWith('eyJ')) {
      throw new Error('❌ Ungültiger Service Role Key. Sollte mit "eyJ" beginnen.');
    }

    // Schritt 3: Neue .env erstellen
    console.log('✅ Eingaben validiert. Erstelle neue .env...\n');

    const newEnvContent = `# Supabase Configuration - RaveTracker v3
# Updated: ${new Date().toISOString()}

VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}${serviceKey ? `\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}` : ''}

# Project Configuration
SUPABASE_PROJECT_ID=${projectId}

# Environment Configuration
NODE_ENV=development
VITE_APP_URL=http://localhost:5173

# App Configuration
VITE_APP_NAME=RaveTracker
VITE_APP_VERSION=3.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_PWA=true

# API Configuration
VITE_API_VERSION=v1
VITE_MAX_FILE_SIZE=5242880

# Social Authentication (Optional)
# VITE_GOOGLE_CLIENT_ID=your-google-client-id
# VITE_GITHUB_CLIENT_ID=your-github-client-id
`;

    writeFileSync(envPath, newEnvContent);
    console.log('✅ Neue .env Datei erstellt!\n');

    // Schritt 4: Zusammenfassung
    console.log('📊 KONFIGURATION ABGESCHLOSSEN:');
    console.log('='.repeat(40));
    console.log(`🔗 Project URL: ${projectUrl}`);
    console.log(`🆔 Project ID: ${projectId}`);
    console.log(`🔑 Anon Key: ${anonKey.substring(0, 20)}...`);
    if (serviceKey) {
      console.log(`🔐 Service Key: ${serviceKey.substring(0, 20)}...`);
    }
    console.log('');

    // Schritt 5: Nächste Schritte
    console.log('🚀 NÄCHSTE SCHRITTE:');
    console.log('1. Führe das SQL-Script in Supabase Dashboard aus:');
    console.log('   → SQL Editor → safe_database_reset.sql');
    console.log('');
    console.log('2. Teste die Konfiguration:');
    console.log('   → node scripts/verify-database.mjs');
    console.log('');
    console.log('3. Starte die Anwendung:');
    console.log('   → npm run dev');
    console.log('');
    console.log('4. Optional: Supabase CLI verknüpfen:');
    console.log(`   → npx supabase link --project-ref ${projectId}`);

    console.log('\n🎉 Supabase Neukonfiguration erfolgreich abgeschlossen!');
    console.log('📖 Detaillierte Anleitung: SUPABASE_RESET_GUIDE.md');

  } catch (error) {
    console.error('\n❌ Fehler bei der Konfiguration:', error.message);
    console.log('\n💡 Hilfe:');
    console.log('- Überprüfe deine Supabase Project-Daten');
    console.log('- Siehe SUPABASE_RESET_GUIDE.md für manuelle Schritte');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Script starten
setupNewSupabase().catch(console.error);
