import { createContext, useContext, useState } from "react";

// Create the context
const UserContext = createContext(null);

// Provider component
export const UserProvider = ({ children }) => {
  // Lazy-init from localStorage
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("userData"));
    } catch {
      return null;
    }
  });

  // Update both state and localStorage
  const updateUser = (newUserData) => {
    setUser(newUserData);
    if (typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(newUserData));
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Default export if you really need it:
export default UserContext;
