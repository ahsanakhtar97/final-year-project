import { Category } from "@/types/categories";
import { Habit } from "@/types/habits";

export interface CreateCategoryPayload {
  categoryName: string;
}

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCategory(categoryId: number): Promise<Category> {
  const res = await fetch(`/api/categories/${categoryId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHabitsByCategoryId(categoryId: number): Promise<Habit[]> {
  const res = await fetch(`/api/categories/${categoryId}/habits`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
