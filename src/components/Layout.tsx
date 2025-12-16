import React from 'react'
import { Outlet } from 'react-router-dom'

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
