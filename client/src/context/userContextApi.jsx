import { createContext, useContext, useEffect, useState } from "react";

// Create the context
const UserContext = createContext();

// Provider component to wrap around your app
export const UserProvider = ({ children }) => {
    // Initialize state with localStorage data to prevent flickering issues
    const [user, setUser] = useState(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("userData");
            if (storedUser) {
                try {
                    return JSON.parse(storedUser);
                } catch (error) {
                    console.error("Error parsing userData from localStorage:", error);
                    return null;
                }
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setLoading(true);
            const storedUser = localStorage.getItem("userData");
            console.log("Fetched user from localStorage:", storedUser);
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Error parsing userData in useEffect:", error);
                }
            }
            setLoading(false);
        }
    }, []);

    // Function to update user data
    const updateUser = (newUserData) => {
        setUser(newUserData);
        if (typeof window !== "undefined") {
            localStorage.setItem("userData", JSON.stringify(newUserData));
        }
    };

    return (
        <UserContext.Provider value={{ user, updateUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook for consuming the context
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};

export default UserContext;
