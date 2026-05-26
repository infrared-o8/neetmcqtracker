import React from "react";
import { 
  useAuth as useClerkAuth,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserButton as ClerkUserButton
} from "@clerk/clerk-react";

const HAS_CLERK = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * A shim for Clerk's useAuth hook that returns a guest-friendly 
 * object if Clerk is not configured. This prevents the app from 
 * crashing when VITE_CLERK_PUBLISHABLE_KEY is missing.
 */
export function useAuth() {
  if (HAS_CLERK) {
    try {
      return useClerkAuth();
    } catch (e) {
      // Fallback if hook is called outside provider
      console.warn("Clerk useAuth called outside provider or failed:", e.message);
    }
  }
  
  return {
    getToken: async () => null,
    userId: null,
    isLoaded: true,
    isSignedIn: false
  };
}

// Helper components that do nothing or show fallback UI when Clerk is missing
export const SignedIn = (props) => (HAS_CLERK ? React.createElement(ClerkSignedIn, props) : null);
export const SignedOut = (props) => (HAS_CLERK ? React.createElement(ClerkSignedOut, props) : props.children);
export const SignInButton = (props) => (HAS_CLERK ? React.createElement(ClerkSignInButton, props) : React.createElement("button", { onClick: () => alert("Clerk Auth is not configured"), className: "opacity-50" }, props.children || "Sign In"));
export const SignUpButton = (props) => (HAS_CLERK ? React.createElement(ClerkSignUpButton, props) : React.createElement("button", { onClick: () => alert("Clerk Auth is not configured"), className: "opacity-50" }, props.children || "Sign Up"));
export const UserButton = (props) => (HAS_CLERK ? React.createElement(ClerkUserButton, props) : React.createElement("div", { className: "h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold" }, "G"));
