import api from './api'
import type { Category } from './catalogTypes'

export function getCategories() {
  return api.get<Category[]>('/categories').then((res) => res.data)
}

export function getAdminCategories() {
  return api.get<Category[]>('/admin/categories').then((res) => res.data)
}

export function createCategory(payload: { categoryName: string; description?: string; iconUrl?: string; sortOrder: number; isActive?: boolean }) {
  return api.post<Category>('/admin/categories', payload).then((res) => res.data)
}

export function updateCategory(id: number, payload: { categoryName: string; description?: string; iconUrl?: string; sortOrder: number; isActive: boolean }) {
  return api.put<Category>(`/admin/categories/${id}`, payload).then((res) => res.data)
}

export function deleteCategory(id: number) {
  return api.delete(`/admin/categories/${id}`).then((res) => res.data)
}
