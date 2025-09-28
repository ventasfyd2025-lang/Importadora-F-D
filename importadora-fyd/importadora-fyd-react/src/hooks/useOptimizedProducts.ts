'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, query, orderBy, limit, getDocs, where, startAfter, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from '@/types'

interface UseOptimizedProductsOptions {
  pageSize?: number
  category?: string
  sortBy?: 'price' | 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface ProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

// Simple in-memory cache
const cache = new Map<string, { data: Product[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useOptimizedProducts(options: UseOptimizedProductsOptions = {}): ProductsResult {
  const {
    pageSize = 20,
    category,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)

  // Create cache key based on options
  const cacheKey = useMemo(() => {
    return `products_${category || 'all'}_${sortBy}_${sortOrder}_${pageSize}`
  }, [category, sortBy, sortOrder, pageSize])

  // Check cache first
  const getCachedData = useCallback(() => {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [cacheKey])

  // Build optimized query
  const buildQuery = useCallback((isLoadMore = false) => {
    let q: any = collection(db, 'products')

    // Add category filter if specified
    if (category) {
      q = query(q, where('categoria', '==', category))
    }

    // Add sorting
    q = query(q, orderBy(sortBy, sortOrder))

    // Add pagination
    if (isLoadMore && lastDoc) {
      q = query(q, startAfter(lastDoc), limit(pageSize))
    } else {
      q = query(q, limit(pageSize))
    }

    return q
  }, [category, sortBy, sortOrder, pageSize, lastDoc])

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true)
      setError(null)

      // Check cache for initial load
      if (!isLoadMore) {
        const cachedData = getCachedData()
        if (cachedData) {
          setProducts(cachedData)
          setLoading(false)
          return
        }
      }

      const q = buildQuery(isLoadMore)
      const snapshot = await getDocs(q)

      const newProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[]

      if (isLoadMore) {
        setProducts(prev => [...prev, ...newProducts])
      } else {
        setProducts(newProducts)
        // Cache the first page
        cache.set(cacheKey, {
          data: newProducts,
          timestamp: Date.now()
        })
      }

      // Update pagination state
      setHasMore(newProducts.length === pageSize)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] as any || null)

    } catch (err) {
      setError('Error cargando productos')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [buildQuery, getCachedData, cacheKey, pageSize])

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchProducts(true)
    }
  }, [fetchProducts, loading, hasMore])

  const refresh = useCallback(async () => {
    // Clear cache for this query
    cache.delete(cacheKey)
    setLastDoc(null)
    await fetchProducts(false)
  }, [fetchProducts, cacheKey])

  // Initial load
  useEffect(() => {
    fetchProducts(false)
  }, [fetchProducts])

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Optional: Clean up old cache entries
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          cache.delete(key)
        }
      }
    }
  }, [])

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}