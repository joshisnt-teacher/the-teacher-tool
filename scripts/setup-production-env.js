#!/usr/bin/env node

/**
 * Helper script to set up production environment variables
 * Run this script and follow the prompts to configure your production database
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProductionEnv() {
  console.log('🚀 Production Environment Setup');
  console.log('================================\n');
  
  console.log('This script will help you configure environment variables for production deployment.\n');
  
  const supabaseUrl = await question('Enter your Supabase Project URL (e.g., https://your-project-id.supabase.co): ');
  const supabaseKey = await question('Enter your Supabase anon/public key: ');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Both URL and key are required. Exiting...');
    rl.close();
    return;
  }
  
  console.log('\n📋 Environment Variables to Set:\n');
  console.log('For your hosting platform (Netlify, Vercel, etc.), set these variables:');
  console.log('─'.repeat(60));
  console.log(`VITE_SUPABASE_URL=${supabaseUrl}`);
  console.log(`VITE_SUPABASE_ANON_KEY=${supabaseKey}`);
  console.log('─'.repeat(60));
  
  console.log('\n📝 For Node.js scripts, also set:');
  console.log('─'.repeat(60));
  console.log(`SUPABASE_URL=${supabaseUrl}`);
  console.log(`SUPABASE_ANON_KEY=${supabaseKey}`);
  console.log('─'.repeat(60));
  
  const createEnvFile = await question('\nWould you like to create a .env.production file? (y/n): ');
  
  if (createEnvFile.toLowerCase() === 'y' || createEnvFile.toLowerCase() === 'yes') {
    const envContent = `# Production Environment Variables
# Copy these to your hosting platform's environment variable settings

VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}

# For Node.js scripts
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}
`;
    
    try {
      fs.writeFileSync('.env.production', envContent);
      console.log('✅ Created .env.production file');
      console.log('⚠️  Remember: Do NOT commit this file to version control!');
    } catch (error) {
      console.log('❌ Failed to create .env.production file:', error.message);
    }
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Set the environment variables in your hosting platform');
  console.log('2. Deploy your application');
  console.log('3. Your app will automatically use the production database');
  
  rl.close();
}

setupProductionEnv().catch(console.error);
