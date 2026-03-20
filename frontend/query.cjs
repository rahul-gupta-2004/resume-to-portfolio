const { createClient } = require('@supabase/supabase-js');
const url = 'https://morecxlvqsvoyxebyenm.supabase.co';
const key = process.env.SUPABASE_KEY;
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('applications').select('*').limit(1);
  console.log("DATA:", data);
  console.log("ERROR:", error);
}
check();
