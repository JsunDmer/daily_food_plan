const API_BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || '请求失败')
  }
  return res.json()
}

// 计划相关
export const generatePlan = () => request('/plan/generate', { method: 'POST' })
export const getCurrentPlan = () => request('/plan/current')
export const regenerateDay = (dayIndex) => request('/plan/regenerate-day', {
  method: 'POST',
  body: JSON.stringify({ dayIndex })
})

// 菜谱相关
export const getRecipes = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/recipes${query ? '?' + query : ''}`)
}
export const getRecipe = (id) => request(`/recipes/${id}`)
export const addRecipe = (data) => request('/recipes', {
  method: 'POST',
  body: JSON.stringify(data)
})
export const updateRecipe = (id, data) => request(`/recipes/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
})
export const favoriteRecipe = (id) => request(`/recipes/${id}/favorite`, { method: 'POST' })
export const dislikeRecipe = (id) => request(`/recipes/${id}/dislike`, { method: 'POST' })
export const unfavoriteRecipe = (id) => request(`/recipes/${id}/favorite`, { method: 'DELETE' })
export const undislikeRecipe = (id) => request(`/recipes/${id}/dislike`, { method: 'DELETE' })
