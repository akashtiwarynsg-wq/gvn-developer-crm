import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

/**
 * Generic hook for paginated list pages.
 * fetcher  – async fn(params) → { data:[], meta:{ total } }
 * initial  – initial filter params
 */
export function useList(fetcher, initial = {}) {
  const [items,   setItems]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [params,  setParamsRaw] = useState({ page: 1, limit: 25, ...initial })
  const abortRef = useRef(null)

  const load = useCallback(async (p) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(p)
      // Handle both { data, meta } and plain array responses
      if (Array.isArray(res)) {
        setItems(res)
        setTotal(res.length)
      } else {
        setItems(res.data  ?? [])
        setTotal(res.meta?.total ?? res.total ?? (res.data ?? []).length)
      }
    } catch (e) {
      if (e?.name === 'CanceledError') return
      const msg = e?.error || e?.message || 'Failed to load data'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => { load(params) }, [params])

  const setParams = useCallback((updates) =>
    setParamsRaw(prev => ({ ...prev, ...updates, page: 1 })), [])

  const refetch = useCallback(() => load(params), [params])

  return { items, total, loading, error, params, setParams, refetch }
}

/**
 * Generic hook for single-record detail fetch.
 */
export function useOne(fetcher, id) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetcher(id)
      setData(res)
    } catch (e) {
      const msg = e?.error || e?.message || 'Failed to load'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  return { data, loading, error, refetch: load }
}

/**
 * Mutation helper – create / update / delete with loading + toast.
 */
export function useMutation(mutFn, { onSuccess, successMsg } = {}) {
  const [loading, setLoading] = useState(false)

  const mutate = useCallback(async (payload) => {
    setLoading(true)
    try {
      const res = await mutFn(payload)
      if (successMsg) toast.success(successMsg)
      if (onSuccess)  onSuccess(res)
      return { ok: true, data: res }
    } catch (e) {
      const msg = e?.error || e?.details?.[0]?.message || e?.message || 'Operation failed'
      toast.error(msg)
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [mutFn, onSuccess, successMsg])

  return { mutate, loading }
}
