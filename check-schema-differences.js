import { createClient } from '@supabase/supabase-js';

// Configuration
const cloudClient = createClient(
  'https://aogorchudxilnkhtfvqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA'
);

const localClient = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

// Tables that had schema issues during sync
const PROBLEM_TABLES = [
  'content_item',
  'class_sessions',
  'users'
];

function logStep(message) {
  console.log(`\n🔍 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

async function getTableColumns(client, tableName, clientType) {
  try {
    // Get a sample record to see the actual column structure
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return { exists: false, columns: [], error: `Table ${tableName} doesn't exist in ${clientType}` };
      }
      return { exists: true, columns: [], error: error.message };
    }
    
    if (!data || data.length === 0) {
      // Table exists but no data - try to get column info another way
      logWarning(`No data in ${clientType} ${tableName} - will show what we can detect`);
      return { exists: true, columns: [], error: 'No data to analyze columns' };
    }
    
    const columns = Object.keys(data[0]).sort();
    return { exists: true, columns, sampleData: data[0] };
    
  } catch (err) {
    return { exists: false, columns: [], error: err.message };
  }
}

async function compareTableSchemas(tableName) {
  logStep(`Analyzing table: ${tableName}`);
  
  const cloudInfo = await getTableColumns(cloudClient, tableName, 'cloud');
  const localInfo = await getTableColumns(localClient, tableName, 'local');
  
  console.log(`\n📋 ${tableName.toUpperCase()} SCHEMA COMPARISON:`);
  
  // Check if tables exist
  if (!cloudInfo.exists) {
    logError(`Cloud table ${tableName} doesn't exist`);
    return;
  }
  
  if (!localInfo.exists) {
    logError(`Local table ${tableName} doesn't exist`);
    return;
  }
  
  // Check for errors
  if (cloudInfo.error && !cloudInfo.error.includes('No data')) {
    logError(`Cloud error: ${cloudInfo.error}`);
  }
  
  if (localInfo.error && !localInfo.error.includes('No data')) {
    logError(`Local error: ${localInfo.error}`);
  }
  
  // Compare columns if we have them
  if (cloudInfo.columns.length > 0 && localInfo.columns.length > 0) {
    const cloudCols = new Set(cloudInfo.columns);
    const localCols = new Set(localInfo.columns);
    
    const onlyInCloud = [...cloudCols].filter(col => !localCols.has(col));
    const onlyInLocal = [...localCols].filter(col => !cloudCols.has(col));
    const common = [...cloudCols].filter(col => localCols.has(col));
    
    console.log(`  📊 Column Summary:`);
    console.log(`    Common columns: ${common.length}`);
    console.log(`    Cloud-only columns: ${onlyInCloud.length}`);
    console.log(`    Local-only columns: ${onlyInLocal.length}`);
    
    if (onlyInCloud.length > 0) {
      logWarning(`Columns only in CLOUD: ${onlyInCloud.join(', ')}`);
    }
    
    if (onlyInLocal.length > 0) {
      logWarning(`Columns only in LOCAL: ${onlyInLocal.join(', ')}`);
    }
    
    if (onlyInCloud.length === 0 && onlyInLocal.length === 0) {
      logSuccess(`All columns match!`);
    }
    
    // Show sample data structure
    if (cloudInfo.sampleData) {
      console.log(`\n  📝 Cloud sample data structure:`);
      Object.entries(cloudInfo.sampleData).forEach(([key, value]) => {
        const type = value === null ? 'null' : typeof value;
        console.log(`    ${key}: ${type} = ${JSON.stringify(value)}`);
      });
    }
    
    if (localInfo.sampleData) {
      console.log(`\n  📝 Local sample data structure:`);
      Object.entries(localInfo.sampleData).forEach(([key, value]) => {
        const type = value === null ? 'null' : typeof value;
        console.log(`    ${key}: ${type} = ${JSON.stringify(value)}`);
      });
    }
  } else {
    if (cloudInfo.columns.length === 0) {
      logWarning(`Cannot analyze cloud columns: ${cloudInfo.error || 'No data available'}`);
    }
    if (localInfo.columns.length === 0) {
      logWarning(`Cannot analyze local columns: ${localInfo.error || 'No data available'}`);
    }
  }
}

async function main() {
  console.log('🔍 Database Schema Difference Checker\n');
  console.log('This will help identify specific schema mismatches between cloud and local databases.\n');
  
  for (const tableName of PROBLEM_TABLES) {
    await compareTableSchemas(tableName);
    console.log('\n' + '='.repeat(80));
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review the schema differences above');
  console.log('2. Update your local database schema to match cloud');
  console.log('3. You can use Supabase migrations or direct SQL to fix schema issues');
  console.log('4. Run this script again to verify fixes');
  console.log('5. Then run "node sync-data.js" to test the sync');
}

main().catch(console.error);
