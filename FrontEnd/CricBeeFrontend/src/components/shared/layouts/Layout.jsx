"use client"

import Header from "./Header"
import Footer from "./Footer"

export default function Layout({ children, title, profilePath, showFooter = true }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={title} profilePath={profilePath} />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}