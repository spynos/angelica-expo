import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const POEM_SELECT = `
  *,
  author:users!poems_user_id_fkey ( id, nickname, avatar_url ),
  likes:likes ( user_id )
`;

console.log('Running feed query...');
const start = Date.now();
const { data, error } = await supabase
  .from('poems')
  .select(POEM_SELECT)
  .eq('visibility', 'public')
  .order('created_at', { ascending: false })
  .limit(50);
console.log('Duration:', Date.now() - start, 'ms');

if (error) {
  console.error('❌ Error:', JSON.stringify(error, null, 2));
  process.exit(1);
}
console.log('✅ Rows:', data?.length);
console.log(JSON.stringify(data?.slice(0, 1), null, 2));
