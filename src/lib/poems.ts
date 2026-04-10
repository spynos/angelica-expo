import { supabase } from './supabase';
import type { Poem, PoemBgColor, PoemFont, PoemVisibility, PoemWithAuthor } from '@/src/types/db';

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
  const { data, error } = await supabase
    .from('poems')
    .select(POEM_SELECT)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as RawPoem[]).map((r) => shape(r, viewerId));
}

export async function fetchPoem(
  id: string,
  viewerId: string | null,
): Promise<PoemWithAuthor | null> {
  const [{ data, error }, bookmarkRes] = await Promise.all([
    supabase.from('poems').select(POEM_SELECT).eq('id', id).maybeSingle(),
    viewerId
      ? supabase
          .from('bookmarks')
          .select('user_id')
          .eq('poem_id', id)
          .eq('user_id', viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ]);
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
  const { data, error } = await supabase
    .from('poems')
    .select(POEM_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
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
