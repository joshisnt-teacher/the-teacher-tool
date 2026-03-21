import { createClient } from '@supabase/supabase-js';

const cloudClient = createClient(
  'https://aogorchudxilnkhtfvqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxMzMxNywiZXhwIjoyMDcyOTg5MzE3fQ.pL1-TBMlFmnIo1NNaSkdL1X6WzD2of3FjZVMBrI-0QA'
);

const localClient = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function getTableList(client, name) {
  try {
    const { data, error } = await client.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.error(`❌ Error getting ${name} tables:`, error.message);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error(`❌ Error getting ${name} tables:`, err.message);
    return [];
  }
}

async function getTableInfo(client, tableName, dbName) {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    const { count } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return { exists: true, count: count || 0 };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function compareSchemas() {
  console.log('🔍 Comparing database schemas...\n');
  
  console.log('📊 Getting table lists...');
  const cloudTables = await getTableList(cloudClient, 'cloud');
  const localTables = await getTableList(localClient, 'local');
  
  console.log(`\n☁️  Cloud tables (${cloudTables.length}):`);
  cloudTables.forEach(table => console.log(`  - ${table.table_name}`));
  
  console.log(`\n🏠 Local tables (${localTables.length}):`);
  localTables.forEach(table => console.log(`  - ${table.table_name}`));
  
  // Find common tables
  const cloudTableNames = cloudTables.map(t => t.table_name);
  const localTableNames = localTables.map(t => t.table_name);
  const commonTables = cloudTableNames.filter(name => localTableNames.includes(name));
  
  console.log(`\n🤝 Common tables (${commonTables.length}):`);
  commonTables.forEach(table => console.log(`  - ${table}`));
  
  // Check data counts for common tables
  console.log('\n📈 Data comparison for common tables:');
  for (const tableName of commonTables) {
    const cloudInfo = await getTableInfo(cloudClient, tableName, 'cloud');
    const localInfo = await getTableInfo(localClient, tableName, 'local');
    
    console.log(`\n  ${tableName}:`);
    console.log(`    Cloud: ${cloudInfo.exists ? `${cloudInfo.count} records` : `❌ ${cloudInfo.error}`}`);
    console.log(`    Local: ${localInfo.exists ? `${localInfo.count} records` : `❌ ${localInfo.error}`}`);
    
    if (cloudInfo.exists && localInfo.exists) {
      if (cloudInfo.count === localInfo.count) {
        console.log(`    Status: ✅ Synced (${cloudInfo.count} records)`);
      } else {
        console.log(`    Status: ⚠️  Different counts (Cloud: ${cloudInfo.count}, Local: ${localInfo.count})`);
      }
    }
  }
  
  // Tables only in cloud
  const cloudOnlyTables = cloudTableNames.filter(name => !localTableNames.includes(name));
  if (cloudOnlyTables.length > 0) {
    console.log(`\n☁️  Tables only in cloud (${cloudOnlyTables.length}):`);
    cloudOnlyTables.forEach(table => console.log(`  - ${table}`));
  }
  
  // Tables only in local
  const localOnlyTables = localTableNames.filter(name => !cloudTableNames.includes(name));
  if (localOnlyTables.length > 0) {
    console.log(`\n🏠 Tables only in local (${localOnlyTables.length}):`);
    localOnlyTables.forEach(table => console.log(`  - ${table}`));
  }
  
  console.log('\n🎯 Recommended sync tables:');
  console.log(JSON.stringify(commonTables, null, 2));
}

compareSchemas().catch(console.error);
