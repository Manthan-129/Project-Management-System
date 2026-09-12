import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosInstance.js';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket.js';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [socket, setSocket] = useState(null);

    const authHeaders = useMemo(() => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [token]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            const savedTheme = localStorage.getItem('theme') || 'system';
            const resolvedTheme = savedTheme === 'system'
                ? (mediaQuery.matches ? 'dark' : 'light')
                : savedTheme;

            root.classList.toggle('dark', resolvedTheme === 'dark');
            root.setAttribute('data-theme', resolvedTheme);
        };

        const handleStorageChange = (event) => {
            if (!event.key || event.key === 'theme') {
                applyTheme();
            }
        };

        applyTheme();
        window.addEventListener('storage', handleStorageChange);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', applyTheme);
        } else {
            mediaQuery.addListener(applyTheme);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', applyTheme);
            } else {
                mediaQuery.removeListener(applyTheme);
            }
        };
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            const s = connectSocket(token);
            setSocket(s);
            return;
        }

        localStorage.removeItem('token');
        disconnectSocket();
        setSocket(null);
    }, [token]);

    const logout = async () => {
        setUser(null);
        setToken('');
        setNotifications([]);
        setUnreadNotificationsCount(0);
        disconnectSocket();
        setSocket(null);
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

    const fetchCurrentUser = useCallback(async () => {
        if (!token) {
            setUser(null);
            return;
        }

        try {
            const { data } = await api.get('/auth/user-info', {
                headers: authHeaders,
            });

            if (data?.success && data?.user) {
                setUser(data.user);
                return;
            }

            setUser(null);
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout();
                return;
            }

            setUser(null);
        }
    }, [token, authHeaders]);

    const updateProfile = async (profileData) => {
        try {
            const isFormData = typeof FormData !== 'undefined' && profileData instanceof FormData;
            const headers = { ...authHeaders };

            if (isFormData) {
                headers['Content-Type'] = 'multipart/form-data';
            }

            const { data } = await api.put('/settings/update-profile', profileData, { headers });

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
            const { data } = await api.get('/notifications/my-notifications', {
                headers: authHeaders,
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

    useEffect(() => {
        fetchCurrentUser();
        fetchNotifications();
    }, [fetchCurrentUser]);

    // Setup global socket event listeners for notifications, friend requests, and invites
    useEffect(() => {
        if (!socket) return;

        const handleNotificationReceived = (notification) => {
            if (!notification) return;
            setNotifications((prev) => [notification, ...prev]);
            setUnreadNotificationsCount((prev) => prev + 1);
            toast.info(`${notification.title}: ${notification.message}`, {
                autoClose: 4000,
            });
        };

        const handleFriendRequestReceived = (invite) => {
            toast.info(`Friend request received from ${invite?.sender?.firstName || 'a user'}.`, {
                autoClose: 4000,
            });
        };

        const handleTeamInvitationReceived = (invitation) => {
            toast.info(`Team invitation received for ${invitation?.team?.name || 'a team'}.`, {
                autoClose: 4000,
            });
        };

        socket.on('notification:received', handleNotificationReceived);
        socket.on('friend:request_received', handleFriendRequestReceived);
        socket.on('team:invitation_received', handleTeamInvitationReceived);

        return () => {
            socket.off('notification:received', handleNotificationReceived);
            socket.off('friend:request_received', handleFriendRequestReceived);
            socket.off('team:invitation_received', handleTeamInvitationReceived);
        };
    }, [socket]);

    const markNotificationAsRead = async (notificationId) => {
        try {
            const { data } = await api.put(
                `/notifications/mark-read/${notificationId}`,
                {},
                { headers: authHeaders }
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
                { headers: authHeaders }
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

    const value = {
        navigate,
        user,
        setUser,
        updateProfile,
        token,
        setToken,
        logout,
        ensureAuthenticated,
        fetchCurrentUser,
        notifications,
        setNotifications,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        authHeaders,
        fetchNotifications,
        markNotificationAsRead,
        markNotificationsAsRead,
        socket,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
