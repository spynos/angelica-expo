import { supabase } from './supabase';
import { withTimeout } from './async';
import type { Poem, PoemBgColor, PoemFont, PoemVisibility, PoemWithAuthor } from '@/src/types/db';

const FEED_TIMEOUT_MS = 8000;
const POEM_TIMEOUT_MS = 6000;

const POEM_SELECT = `
  *,
  author:users!poems_user_id_fkey ( id, nickname, avatar_url ),
  likes:likes ( user_id )
`;

type RawPoem = Omit<Poem, never> & {
  author: { id: string; nickname: string; avatar_url: string | null };
  likes: { user_id: string }[];
};

function shape(row: RawPoem, viewerId: string | null): PoemWithAuthor {
  const likes = row.likes ?? [];
  return {
    ...row,
    author: row.author,
    like_count: likes.length,
    liked_by_me: viewerId ? likes.some((l) => l.user_id === viewerId) : false,
    bookmarked_by_me: false,
  };
}

export async function fetchFeed(viewerId: string | null): Promise<PoemWithAuthor[]> {
  const started = Date.now();
  console.log('[poems] fetchFeed start', { viewerId });
  try {
    const query = supabase
      .from('poems')
      .select(POEM_SELECT)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(50);
    const { data, error, status } = await withTimeout(query, FEED_TIMEOUT_MS, 'fetchFeed');
    if (error) {
      console.warn('[poems] fetchFeed error', {
        status,
        code: (error as any).code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      throw error;
    }
    console.log('[poems] fetchFeed ok', {
      ms: Date.now() - started,
      count: data?.length ?? 0,
      status,
    });
    return (data as unknown as RawPoem[]).map((r) => shape(r, viewerId));
  } catch (e: any) {
    console.warn('[poems] fetchFeed threw', {
      ms: Date.now() - started,
      name: e?.name,
      message: e?.message,
    });
    throw e;
  }
}

export async function fetchPoem(
  id: string,
  viewerId: string | null,
): Promise<PoemWithAuthor | null> {
  const poemQuery = supabase.from('poems').select(POEM_SELECT).eq('id', id).maybeSingle();
  const bookmarkQuery = viewerId
    ? supabase
        .from('bookmarks')
        .select('user_id')
        .eq('poem_id', id)
        .eq('user_id', viewerId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null } as const);
  const [{ data, error }, bookmarkRes] = await withTimeout(
    Promise.all([poemQuery, bookmarkQuery]),
    POEM_TIMEOUT_MS,
    'fetchPoem',
  );
  if (error) throw error;
  if (!data) return null;
  const shaped = shape(data as unknown as RawPoem, viewerId);
  shaped.bookmarked_by_me = !!bookmarkRes.data;
  return shaped;
}

export async function fetchPoemsByUser(
  userId: string,
  viewerId: string | null,
): Promise<PoemWithAuthor[]> {
  const query = supabase
    .from('poems')
    .select(POEM_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  const { data, error } = await withTimeout(query, FEED_TIMEOUT_MS, 'fetchPoemsByUser');
  if (error) throw error;
  return (data as unknown as RawPoem[]).map((r) => shape(r, viewerId));
}

export type CreatePoemInput = {
  title?: string | null;
  body: string;
  font: PoemFont;
  bg_color: PoemBgColor;
  visibility: PoemVisibility;
  tags?: string[];
};

export async function createPoem(userId: string, input: CreatePoemInput) {
  const { data, error } = await supabase
    .from('poems')
    .insert({
      user_id: userId,
      title: input.title ?? null,
      body: input.body,
      font: input.font,
      bg_color: input.bg_color,
      visibility: input.visibility,
      tags: input.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data as Poem;
}

export async function updatePoem(id: string, input: Partial<CreatePoemInput>) {
  const { data, error } = await supabase
    .from('poems')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Poem;
}

export async function deletePoem(id: string) {
  const { error } = await supabase.from('poems').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleLike(poemId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('poem_id', poemId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ poem_id: poemId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleBookmark(
  poemId: string,
  userId: string,
  currentlyBookmarked: boolean,
) {
  if (currentlyBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('poem_id', poemId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ poem_id: poemId, user_id: userId });
    if (error) throw error;
  }
}
