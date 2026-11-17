import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataFile, putDataFile } from '../lib/github.js';

export interface DataFileState<T> {
  originalData: T | null;
  editData: T | null;
  sha: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  setEditData: (updater: T | ((prev: T) => T)) => void;
  updateEditData: (patch: Partial<T>) => void;
  save: (message?: string) => Promise<void>;
  discard: () => void;
  reload: () => Promise<void>;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Generic edit-console data hook: loads a JSON file through the GitHub
 * proxy, tracks local edits against the fetched copy, and commits with
 * optimistic locking (SHA). `apiBase` is the proxy root (e.g. `/edit-api`
 * inside admin-console, `/api/edit` on public-website itself).
 */
export function useDataFile<T>(path: string, apiBase: string, commitPrefix = 'Update'): DataFileState<T> {
  const [originalData, setOriginalData] = useState<T | null>(null);
  const [editData, setEditDataState] = useState<T | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const file = await getDataFile<T>(apiBase, path);
      if (!mounted.current) return;
      setOriginalData(file.content);
      setEditDataState(file.content);
      setSha(file.sha);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : 'load failed');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [apiBase, path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setEditData = useCallback((updater: T | ((prev: T) => T)) => {
    setEditDataState((prev) => {
      if (prev === null || prev === undefined) return prev;
      return typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
    });
  }, []);

  const updateEditData = useCallback(
    (patch: Partial<T>) => {
      setEditDataState((prev) => {
        if (!isObject(prev)) return prev;
        return { ...prev, ...patch } as T;
      });
    },
    [],
  );

  const save = useCallback(
    async (message?: string) => {
      if (editData === null || editData === undefined || sha === null) return;
      setSaving(true);
      setError(null);
      try {
        const newSha = await putDataFile(apiBase, path, editData, sha, message ?? `${commitPrefix} ${path}`);
        if (!mounted.current) return;
        setOriginalData(editData);
        setSha(newSha);
      } catch (e) {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : 'save failed');
        throw e;
      } finally {
        if (mounted.current) setSaving(false);
      }
    },
    [apiBase, path, editData, sha, commitPrefix],
  );

  const discard = useCallback(() => {
    setEditDataState(originalData);
    setError(null);
  }, [originalData]);

  const dirty =
    editData !== null &&
    editData !== undefined &&
    originalData !== null &&
    originalData !== undefined &&
    JSON.stringify(editData) !== JSON.stringify(originalData);

  return {
    originalData,
    editData,
    sha,
    loading,
    saving,
    error,
    dirty,
    setEditData,
    updateEditData,
    save,
    discard,
    reload,
  };
}
