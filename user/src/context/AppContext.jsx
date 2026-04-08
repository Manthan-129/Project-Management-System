import React, { useEffect, useState } from 'react'
import { createContext } from 'react'
import { useNavigate } from 'react-router-dom'

export const AppContext= createContext();

export const AppContextProvider= (props)=>{
    const navigate= useNavigate();
    const [user, setUser]= useState({
        defaultValues: {
            firstName: "Manthan",
        lastName: "Singla",
        email: "manthan29singla@gmail.com",
        username: "Mant@29",
        }
    });

    const backendUrl= import.meta.env.VITE_BACKEND_URL;

    const [notifications, setNotifications]= useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount]= useState(0);
    const [token, setToken]= useState("Ram");
    
    const fetchUser= async () => {
        try{

        }catch(error){

        }
    }

    const updateProfile= async (data)=>{

    };

    const fetchNotifications= async ()=> {
        if(!token) return;

        try{
            // API
        }catch(error){

        }
    }

    const markNotificationAsRead= async (notificationId) => {
        try{

        }
        catch(error){

        }
    }

    const markNotificationsAsRead= async ()=> {
        try{

        }catch(error){

        }
    }

    useEffect(() => {
        if(!token) return;

        const intervalId= setInterval(() => {
            fetchNotifications();
        },30000);

        return () => clearInterval(intervalId);
    },[token])

    const logout= async ()=>{
        setUser(null);
        setToken(null);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        localStorage.removeItem('token');
        navigate('/');
    };

    const value={
        navigate,
        backendUrl,
        user, setUser,
        token, setToken,
        updateProfile,
        logout,
        notifications, setNotifications,
        unreadNotificationsCount, setUnreadNotificationsCount,
        fetchNotifications,
        markNotificationAsRead,
        markNotificationsAsRead,
    };

    return (
        <AppContext.Provider value={value}> 
            {props.children}
        </AppContext.Provider>
    )
}
