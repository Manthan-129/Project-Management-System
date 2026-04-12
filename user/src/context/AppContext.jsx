import { createContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosInstance.js';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        firstName: 'Manthan',
        lastName: 'Singla',
        email: 'manthan29singla@gmail.com',
        username: 'Mant@29',
    });

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    const logout = async () => {
        setUser(null);
        setToken('');
        setNotifications([]);
        setUnreadNotificationsCount(0);
        localStorage.removeItem('token');
        navigate('/');
    };

    const ensureAuthenticated = useCallback((options = {}) => {
        const { redirectTo = '/login', showToast = true } = options;

        if (!token) {
            if (showToast) {
                toast.error('Session expired. Please login again.');
            }
            navigate(redirectTo);
            return false;
        }

        return true;
    }, [token, navigate]);

    const updateProfile = async (profileData) => {
        try {
            const isFormData = typeof FormData !== 'undefined' && profileData instanceof FormData;
            const headers = {
                Authorization: `Bearer ${token}`,
            };

            if (isFormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const { data } = await api.patch('/settings/update-user-info', profileData, { headers });

            if (data?.success && data?.user) {
                setUser(data.user);
            }

            return data;
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
            }
            throw error;
        }
    };

    const syncNotificationsResponse = (data) => {
        setNotifications(data?.notifications || []);
        setUnreadNotificationsCount(data?.unreadCount || 0);
    };

    const fetchNotifications = async () => {
        if (!token) return;

        try {
            const { data } = await api.get('/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data?.success) {
                syncNotificationsResponse(data);
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
            }
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            const { data } = await api.put(
                `/notifications/mark-read/${notificationId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data?.success) {
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification._id === notificationId
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
                setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
            }
        }
    };

    const markNotificationsAsRead = async () => {
        try {
            const { data } = await api.put(
                '/notifications/mark-all-read',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data?.success) {
                setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
                setUnreadNotificationsCount(0);
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
            }
        }
    };

    useEffect(() => {
        if (!token) return;

        fetchNotifications();
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [token]);

    const value = {
        navigate,
        backendUrl,
        user,
        setUser,
        updateProfile,
        token,
        setToken,
        logout,
        ensureAuthenticated,
        notifications,
        setNotifications,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        fetchNotifications,
        markNotificationAsRead,
        markNotificationsAsRead,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
