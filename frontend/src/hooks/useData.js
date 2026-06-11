import { useState, useEffect, useCallback } from 'react'

/**
 * Simple single-fetch hook. Pass a memoized fetcher (useCallback).
 */
export function useData(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      setData(res)
    } catch (e) {
      setError(e?.error || e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => { load() }, [load])
  return { data, loading, error, refetch: load }
}

/**
 * Paginated list hook.
 */
export function useList(fetcher, initialParams = {}) {
  const [items,   setItems]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [params,  setParamsRaw] = useState({ page: 1, limit: 20, ...initialParams })

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetcher(p)
      if (Array.isArray(res)) { setItems(res); setTotal(res.length) }
      else { setItems(res.data ?? []); setTotal(res.meta?.total ?? res.total ?? (res.data ?? []).length) }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => { load(params) }, [params])

  const setParams = useCallback((u) => setParamsRaw(p => ({ ...p, ...u, page: 1 })), [])
  return { items, total, loading, params, setParams, refetch: () => load(params) }
}
