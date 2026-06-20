import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

const useInitAuth = () => {
    const setAuth = useAuthStore((s) => s.setAuth);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (token && user) {
            setAuth(JSON.parse(user), token);
        }
    }, []);
};

export default useInitAuth;