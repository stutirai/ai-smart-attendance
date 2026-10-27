'use client';

import { useState, useEffect, useCallback } from 'react';
import { FacultyProfile } from '@/types';
import { api } from '@/services/api';

const STORAGE_KEY = 'attendance_faculty_profile';

export const DEFAULT_FACULTY_PROFILE: FacultyProfile = {
  name: 'Faculty Portal',
  role: 'Faculty In-Charge',
  department: 'Department of AI / AI&DS',
  institute: 'Greater Noida Institute of Technology (GNIOT)',
  email: 'faculty@gniot.net.in',
};

export function useFacultyProfile() {
  const [profile, setProfile] = useState<FacultyProfile>(DEFAULT_FACULTY_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage or API
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (e) {
      // ignore JSON parse error
    }

    // Background fetch from API to ensure sync
    api.getProfile().then((data) => {
      if (data && data.name) {
        setProfile((prev) => {
          // If localStorage was never explicitly customized, use backend's profile
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) {
            return { ...DEFAULT_FACULTY_PROFILE, ...data };
          }
          return prev;
        });
      }
    }).catch(() => {
      // Ignore network errors on initial mount
    }).finally(() => {
      setIsLoaded(true);
    });
  }, []);

  // Listen for updates across components or tabs
  useEffect(() => {
    const handleCustomUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<FacultyProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setProfile(JSON.parse(stored));
        } catch (e) {}
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setProfile(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener('faculty_profile_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('faculty_profile_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateProfile = useCallback(async (updated: FacultyProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('faculty_profile_updated', { detail: updated }));
    } catch (e) {}

    // Async sync to backend
    try {
      await api.updateProfile(updated);
    } catch (err) {
      console.warn('Backend sync failed, saved locally in browser', err);
    }
  }, []);

  const resetProfile = useCallback(async () => {
    setProfile(DEFAULT_FACULTY_PROFILE);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('faculty_profile_updated', { detail: DEFAULT_FACULTY_PROFILE }));
    } catch (e) {}

    try {
      await api.updateProfile(DEFAULT_FACULTY_PROFILE);
    } catch (err) {}
  }, []);

  return {
    profile,
    isLoaded,
    updateProfile,
    resetProfile,
  };
}
