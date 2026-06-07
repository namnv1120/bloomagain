import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

/**
 * Custom hook fetch toàn bộ app data từ API thay vì staticData.js
 * Fallback về staticData nếu API lỗi
 */
export function useAppData() {
  const [knowledge, setKnowledge] = useState(null);
  const [productCategories, setProductCategories] = useState(null);
  const [healthFacilities, setHealthFacilities] = useState(null);
  const [supportCenters, setSupportCenters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const [knowledgeRes, productsRes, facilitiesRes, centersRes] = await Promise.all([
          fetch(`${API_BASE}/api/knowledge`),
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/facilities`),
          fetch(`${API_BASE}/api/support-centers`)
        ]);

        if (!cancelled) {
          setKnowledge(await knowledgeRes.json());
          setProductCategories(await productsRes.json());
          setHealthFacilities(await facilitiesRes.json());
          setSupportCenters(await centersRes.json());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('API fetch failed, fallback to staticData:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { knowledge, productCategories, healthFacilities, supportCenters, loading, error };
}

/**
 * Fetch suggestions theo gender + age
 */
export async function fetchSuggestions(gender, age) {
  if (!gender || !age) return [];
  try {
    const res = await fetch(`${API_BASE}/api/suggestions?gender=${encodeURIComponent(gender)}&age=${encodeURIComponent(age)}`);
    return await res.json();
  } catch {
    return [];
  }
}

export { API_BASE };
