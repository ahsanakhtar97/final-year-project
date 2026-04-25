import api from "@/lib/axios";
import { Category } from "@/types/categories";
import { Habit } from "@/types/habits";

// Categories support full CRUD from the UI now -- users can add their own
// custom buckets (e.g. "Side projects", "Family") if the seeded ones don't
// cover what they're tracking. All paths use the leading slash so axios
// composes them correctly against /api/v1.

export interface CreateCategoryPayload {
  categoryName: string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>("/categories");
  return res.data;
}

export async function getCategory(categoryId: number): Promise<Category> {
  const res = await api.get<Category>(`/categories/${categoryId}`);
  return res.data;
}

export async function getHabitsByCategoryId(
  categoryId: number,
): Promise<Habit[]> {
  const res = await api.get<Habit[]>(`/categories/${categoryId}/habits`);
  return res.data;
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const res = await api.post<Category>("/categories", payload);
  return res.data;
}
