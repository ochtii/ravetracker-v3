#!/usr/bin/env node
import { rmSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🗑️ RaveTracker v3 - Supabase Cleanup\n');

function cleanupSupabase() {
  try {
    const projectRoot = join(__dirname, '..');
    let cleanedFiles = 0;
    let errors = 0;

    console.log('🔍 Suche nach Supabase-Konfigurationsdateien...\n');

    // 1. Supabase .temp Ordner löschen
    const tempPath = join(projectRoot, 'supabase', '.temp');
    if (existsSync(tempPath)) {
      try {
        rmSync(tempPath, { recursive: true, force: true });
        console.log('✅ Gelöscht: supabase/.temp/');
        cleanedFiles++;
      } catch (err) {
        console.log('❌ Fehler beim Löschen von supabase/.temp:', err.message);
        errors++;
      }
    } else {
      console.log('ℹ️  supabase/.temp/ existiert nicht');
    }

    // 2. Migrations Ordner prüfen und optional löschen
    const migrationsPath = join(projectRoot, 'supabase', 'migrations');
    if (existsSync(migrationsPath)) {
      console.log('⚠️  supabase/migrations/ gefunden - enthält möglicherweise wichtige Daten');
      console.log('   Manuell prüfen und löschen falls gewünscht');
    }

    // 3. Functions Ordner prüfen
    const functionsPath = join(projectRoot, 'supabase', 'functions');
    if (existsSync(functionsPath)) {
      console.log('ℹ️  supabase/functions/ gefunden - behalten (enthält Edge Functions)');
    }

    // 4. Alte SQL-Debug-Dateien löschen (optional)
    const debugFiles = [
      'supabase/debug_categories.sql',
      'supabase/step_by_step_debug.sql',
      'supabase/database_complete_reset.sql'
    ];

    console.log('\n🧹 Optional: Debug-SQL-Dateien aufräumen?');
    console.log('   (Diese werden nicht mehr benötigt nach dem Reset)');
    
    debugFiles.forEach(file => {
      const filePath = join(projectRoot, file);
      if (existsSync(filePath)) {
        try {
          // Nur anzeigen, nicht automatisch löschen
          console.log(`📄 Gefunden: ${file}`);
          console.log(`   → Kann manuell gelöscht werden`);
        } catch (err) {
          console.log(`❌ Fehler bei ${file}:`, err.message);
          errors++;
        }
      }
    });

    // 5. .env Status prüfen
    const envPath = join(projectRoot, '.env');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const hasOldProject = envContent.includes('njovoopqcfywrlhhndlb');
      
      if (hasOldProject) {
        console.log('\n🔧 .env Status:');
        console.log('   ⚠️  Enthält noch alte Supabase-Konfiguration');
        console.log('   → Verwende: node scripts/setup-new-supabase.mjs');
      } else {
        console.log('\n✅ .env Status: Scheint bereits aktualisiert zu sein');
      }
    }

    // 6. Zusammenfassung
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP ZUSAMMENFASSUNG');
    console.log('='.repeat(50));
    console.log(`✅ Aufgeräumte Dateien: ${cleanedFiles}`);
    console.log(`❌ Fehler aufgetreten: ${errors}`);
    
    if (errors === 0) {
      console.log('\n🎉 Cleanup erfolgreich abgeschlossen!');
    } else {
      console.log('\n⚠️  Cleanup mit Fehlern abgeschlossen');
    }

    console.log('\n🚀 NÄCHSTE SCHRITTE:');
    console.log('1. Erstelle neues Supabase Projekt im Dashboard');
    console.log('2. Führe aus: node scripts/setup-new-supabase.mjs');
    console.log('3. Führe SQL-Script in Supabase Dashboard aus');
    console.log('4. Teste mit: node scripts/verify-database.mjs');
    
    console.log('\n📖 Detaillierte Anleitung: SUPABASE_RESET_GUIDE.md');

  } catch (error) {
    console.error('\n❌ Unerwarteter Fehler beim Cleanup:', error.message);
    process.exit(1);
  }
}

// Cleanup starten
cleanupSupabase();
