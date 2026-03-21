// Check if there are schools in the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSchools() {
  console.log('🏫 Checking schools in database...\n');
  
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching schools:', error);
      return;
    }
    
    if (!schools || schools.length === 0) {
      console.log('❌ No schools found in database');
      console.log('💡 Creating Demo College school...');
      
      const { data: newSchool, error: createError } = await supabase
        .from('schools')
        .insert({
          name: 'Demo College',
          domain: 'demo-college.edu',
          logo_url: null
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating school:', createError);
        return;
      }
      
      console.log('✅ Created Demo College school:', newSchool);
    } else {
      console.log(`✅ Found ${schools.length} schools:`);
      schools.forEach((school, index) => {
        console.log(`   ${index + 1}. ${school.name} (ID: ${school.id})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkSchools();
