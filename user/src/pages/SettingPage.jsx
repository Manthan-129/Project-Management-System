// import React from 'react'
// import {Outlet} from 'react-router-dom'
// import Sidebar from '../components/SettingComponents/Sidebar'

// const SettingPage = () => {
//   return (
//     <div>
//         {/* Sidebar navigation */}
//         <Sidebar />
//         {/* Main content area — renders the active settings page */}
//         <main>
//             <Outlet />
//         </main>
//     </div>
//   )
// }

// export default SettingPage

import React from 'react'
import {Outlet} from 'react-router-dom'
import Sidebar from '../components/SettingComponents/Sidebar'

const SettingPage = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content area — renders the active settings page */}
        <main className="flex-1 overflow-y-auto">
            <Outlet />
        </main>

    </div>
  )
}

export default SettingPage