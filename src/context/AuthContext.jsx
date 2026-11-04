
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

// Fetch the logged-in user's profile from Supabase.
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Synchronize Supabase session and user profile.
  const syncSession = useCallback(async (nextSession) => {
    setSession(nextSession ?? null);
    setAuthUser(nextSession?.user ?? null);
    setProfileError("");

    if (!nextSession?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userProfile = await fetchProfile(nextSession.user.id);

      setProfile(userProfile);

      if (!userProfile) {
        setProfileError(
          "Your account exists, but its profile was not found. Check that the Supabase profile trigger is installed."
        );
      }
    } catch (error) {
      console.error("Unable to load user profile:", error);

      setProfile(null);
      setProfileError(
        error.message || "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize authentication and listen for session changes.
  useEffect(() => {
    let active = true;
    let subscription = null;

    const initializeAuth = async () => {
      try {
        // Listen for login, logout and token refresh events.
        const authResult = supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            Promise.resolve().then(() => {
              if (active) {
                void syncSession(nextSession);
              }
            });
          }
        );

        subscription =
          authResult?.data?.subscription ?? null;

        // Restore an existing session.
        const sessionResult = await supabase.auth.getSession();

        if (!active) return;

        if (sessionResult?.error) {
          setProfileError(sessionResult.error.message);
          setLoading(false);
          return;
        }

        const currentSession =
          sessionResult?.data?.session ?? null;

        await syncSession(currentSession);
      } catch (error) {
        console.error("Auth initialization failed:", error);

        if (active) {
          setProfileError(
            error.message ||
              "Unable to initialize authentication."
          );

          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [syncSession]);

  // Register a new user.
  const signUp = useCallback(
    async ({ fullName, email, password, department }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            department: department?.trim() || "",
          },
        },
      });

      if (error) throw error;

      return data;
    },
    []
  );

  // Login an existing user.
  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) throw error;

    return data;
  }, []);

  // Logout the current user.
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setAuthUser(null);
    setProfile(null);
    setProfileError("");
  }, []);

  // Refresh the current user's profile.
  const refreshProfile = useCallback(async () => {
    if (!authUser) return null;

    const data = await fetchProfile(authUser.id);

    setProfile(data);

    return data;
  }, [authUser]);

  const value = useMemo(
    () => ({
      session,
      authUser,
      profile,
      loading,
      profileError,
      isAuthenticated: Boolean(authUser),

      signUp,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      session,
      authUser,
      profile,
      loading,
      profileError,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
