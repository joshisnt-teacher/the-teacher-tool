import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface StudentSession {
  student_id: string;
  central_id: string;
  first_name: string;
  last_name: string;
  year_level: string | null;
}

interface StudentSessionContextType {
  session: StudentSession | null;
  loading: boolean;
  setSession: (session: StudentSession | null) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'pulse_student_session';

const StudentSessionContext = createContext<StudentSessionContextType | undefined>(undefined);

export function StudentSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudentSession;
        setSessionState(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSession = useCallback((next: StudentSession | null) => {
    setSessionState(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signOut = useCallback(() => {
    setSessionState(null);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'https://student.edufied.com.au';
  }, []);

  return (
    <StudentSessionContext.Provider value={{ session, loading, setSession, signOut }}>
      {children}
    </StudentSessionContext.Provider>
  );
}

export const useStudentSession = () => {
  const context = useContext(StudentSessionContext);
  if (context === undefined) {
    throw new Error('useStudentSession must be used within a StudentSessionProvider');
  }
  return context;
};
