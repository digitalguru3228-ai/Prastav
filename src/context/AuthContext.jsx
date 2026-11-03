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
      if (!userProfile) {
        setProfile(null);
        setProfileError(
          "Your account exists, but its profile was not found. Check that the Supabase profile trigger is installed."
        );
      } else {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Unable to load user profile:", error);
      setProfile(null);
      setProfileError(error.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        // Defer the profile query until Supabase has finished its auth callback.
        Promise.resolve().then(() => {
          if (active) void syncSession(nextSession);
        });
      }
    );

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setProfileError(error.message);
        setLoading(false);
        return;
      }
      void syncSession(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const signUp = useCallback(async ({ fullName, email, password, department }) => {
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
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authUser) return null;
    const data = await fetchProfile(authUser.id);
    setProfile(data);
    return data;
  }, [authUser]);

  const value = useMemo(() => ({
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
  }), [session, authUser, profile, loading, profileError, signUp, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
