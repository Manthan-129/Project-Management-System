import React from 'react'
import {Navigate, Routes, Route} from 'react-router-dom'
import { useContext } from 'react'
import { AppContext} from './context/AppContext'
import { ToastContainer } from 'react-toastify'

import LandingPage from './pages/LandingPage.jsx'

import SignupPage from './pages/AuthPages/SignupPage.jsx'   
import LoginPage from './pages/AuthPages/LoginPage.jsx'
import ForgetPasswordPage from './pages/AuthPages/ForgetPassword.jsx'

import SettingPage from './pages/SettingPage.jsx'
import ProfilePage from './components/SettingComponents/ProfilePage.jsx'
import AccountPage from './components/SettingComponents/AccountPage.jsx'
import PrivacyPage from './components/SettingComponents/PrivacyPage.jsx'
import AppearancePage from './components/SettingComponents/AppearancePage.jsx'
import NotificationPage from './components/SettingComponents/NotificationPage.jsx'
import SecurityPage from './components/SettingComponents/SecurityPage.jsx'
import IntegrationPage from './components/SettingComponents/IntegrationPage.jsx'

import DashboardPage from './pages/DashboardPage.jsx'
import DashboardOverview from './components/DashboardComponents/DashboardOverview.jsx'
import Friends from './components/DashboardComponents/Friends.jsx'
import Invitations from './components/DashboardComponents/Invitations.jsx'
import PullRequests from './components/DashboardComponents/PullRequests.jsx'
import TaskWorkspaceBoard from './components/DashboardComponents/TaskWorkspaceBoard.jsx'
import TeamDetails from './components/DashboardComponents/TeamDetails.jsx'
import Teams from './components/DashboardComponents/Teams.jsx'
import UserProfile from './components/DashboardComponents/UserProfile.jsx'

const ProtectedRoute = ({ children })=>{
  const { ensureAuthenticated } = useContext(AppContext);

  if(!ensureAuthenticated({ showToast: false })){
    return <Navigate to='/login' replace />
  }

  return children;
}

const App = () => {
  return (
    <div>
      <ToastContainer />
        <Routes>

          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/signup' element={<SignupPage />} />
          <Route path='/forget-password' element={<ForgetPasswordPage />} />

          <Route path='/settings' element={<ProtectedRoute><SettingPage /></ProtectedRoute>} >

            <Route index element={<ProfilePage />} />
            <Route path='account' element={<AccountPage />} />
            <Route path='privacy' element={<PrivacyPage />} />
            <Route path='appearance' element={<AppearancePage />} />
            <Route path='notification' element={<NotificationPage />} />
            <Route path='security' element={<SecurityPage />} />
            <Route path='integration' element={<IntegrationPage />} />

          </Route>

          <Route path='/dashboard' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}>
            <Route index element={<DashboardOverview />}></Route>
            <Route path='friends' element={<Friends />} />
            <Route path='teams' element={<Teams />} />
            <Route path='teams/:teamId' element={<TeamDetails />} />
            <Route path='tasks-board' element={<TaskWorkspaceBoard />} />
            <Route path='pull-requests' element={<PullRequests />} />
            <Route path='invitations' element={<Invitations />} />
            <Route path='user/:username' element={<UserProfile />} />
          </Route>

        </Routes>
    </div>
  )
}

export default App  