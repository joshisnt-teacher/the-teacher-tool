// Script to check curriculum data specifically
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurriculumData() {
  console.log('📚 Checking curriculum data...\n');
  
  try {
    // Check curriculum table
    const { data: curriculum, error: curriculumError } = await supabase
      .from('curriculum')
      .select('*')
      .order('authority', { ascending: true })
      .order('learning_area', { ascending: true })
      .order('year_band', { ascending: true });
    
    if (curriculumError) {
      console.error('❌ Error fetching curriculum:', curriculumError);
    } else {
      console.log(`📚 Curriculum Records (${curriculum?.length || 0}):`);
      curriculum?.forEach((curriculum, index) => {
        console.log(`   ${index + 1}. ${curriculum.authority} · ${curriculum.learning_area} · ${curriculum.year_band}`);
        console.log(`       Version: ${curriculum.version}, ID: ${curriculum.id}`);
        console.log(`       Description: ${curriculum.year_level_description?.substring(0, 100) || 'No description'}...`);
      });
    }

    // Check strands
    const { data: strands, error: strandsError } = await supabase
      .from('strand')
      .select('*')
      .order('name', { ascending: true });
    
    if (strandsError) {
      console.error('❌ Error fetching strands:', strandsError);
    } else {
      console.log(`\n🧵 Strands (${strands?.length || 0}):`);
      strands?.forEach((strand, index) => {
        console.log(`   ${index + 1}. ${strand.name} (Curriculum: ${strand.curriculum_id})`);
      });
    }

    // Check content items
    const { data: contentItems, error: contentItemsError } = await supabase
      .from('content_item')
      .select('*')
      .order('code', { ascending: true });
    
    if (contentItemsError) {
      console.error('❌ Error fetching content items:', contentItemsError);
    } else {
      console.log(`\n📄 Content Items (${contentItems?.length || 0}):`);
      contentItems?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.code} (Strand: ${item.strand_id})`);
        console.log(`       Description: ${item.description?.substring(0, 80) || 'No description'}...`);
      });
    }

    // Check tags
    const { data: tags, error: tagsError } = await supabase
      .from('tag')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    
    if (tagsError) {
      console.error('❌ Error fetching tags:', tagsError);
    } else {
      console.log(`\n🏷️ Tags (${tags?.length || 0}):`);
      const tagsByType = tags?.reduce((acc, tag) => {
        if (!acc[tag.type]) acc[tag.type] = [];
        acc[tag.type].push(tag);
        return acc;
      }, {});
      
      Object.entries(tagsByType || {}).forEach(([type, typeTags]) => {
        console.log(`   ${type}: ${typeTags.length} tags`);
        typeTags.slice(0, 3).forEach(tag => {
          console.log(`     - ${tag.name}`);
        });
        if (typeTags.length > 3) {
          console.log(`     ... and ${typeTags.length - 3} more`);
        }
      });
    }

    // Check content item tags
    const { data: contentItemTags, error: contentItemTagsError } = await supabase
      .from('content_item_tag')
      .select('*');
    
    if (contentItemTagsError) {
      console.error('❌ Error fetching content item tags:', contentItemTagsError);
    } else {
      console.log(`\n🔗 Content Item Tags (${contentItemTags?.length || 0}):`);
      console.log(`   Total tag associations: ${contentItemTags?.length || 0}`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkCurriculumData();
