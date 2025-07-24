#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🔍 Checking RaveTracker Environment Configuration...\n')

// Check if .env file exists
const envPath = join(process.cwd(), '.env')
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!')
  console.log('📝 Please copy .env.example to .env and configure your Supabase credentials.')
  console.log('   cp .env.example .env\n')
  process.exit(1)
}

// Read and parse .env file
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

// Required environment variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

let allValid = true

console.log('📋 Environment Variables Check:')
console.log('─'.repeat(50))

requiredVars.forEach(varName => {
  const value = envVars[varName]
  
  if (!value) {
    console.log(`❌ ${varName}: Missing`)
    allValid = false
  } else if (value.includes('dummy-') || value.includes('your-')) {
    console.log(`⚠️  ${varName}: Using dummy value`)
    console.log(`   Current: ${value.substring(0, 50)}...`)
    allValid = false
  } else {
    console.log(`✅ ${varName}: Configured`)
  }
})

console.log('─'.repeat(50))

if (allValid) {
  console.log('🎉 Environment configuration looks good!')
  console.log('✨ You can start the development server with: npm run dev')
} else {
  console.log('\n🚨 Environment configuration incomplete!')
  console.log('\n📖 Setup Instructions:')
  console.log('1. Visit https://supabase.com/dashboard')
  console.log('2. Create a new project or select existing one')
  console.log('3. Go to Settings > API')
  console.log('4. Copy your Project URL and anon key')
  console.log('5. Update your .env file with real values')
  console.log('\n📚 For detailed instructions, see: SUPABASE_SETUP.md')
  process.exit(1)
}
