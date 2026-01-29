// useAuth hook
export function useAuth() {
  return {
    user: null,
    login: async () => {},
    logout: async () => {},
    isAuthenticated: false,
  };
}
