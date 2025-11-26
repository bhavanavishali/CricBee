// "use client"

// import { useState } from "react"
// import SignInModal from "@/components/auth/Signin"
// import SignUpModal from "@/components/auth/Signup"


// export default function Home() {
//   const [showSignIn, setShowSignIn] = useState(false)
//   const [showSignUp, setShowSignUp] = useState(false)

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header */}
//       <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
//         <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
//               <span className="text-white font-bold text-sm">CB</span>
//             </div>
//             <span className="font-semibold text-lg">CricB</span>
//           </div>

//           <div className="hidden md:flex items-center gap-8 text-sm">
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Home
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Tournaments
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Live Scores
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Stats
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Players
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               About
//             </a>
//             <a href="#" className="text-gray-700 hover:text-gray-900">
//               Contact
//             </a>
//           </div>

//           <div className="flex items-center gap-3">
//             <a href="/signin" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
//               Sign In
//             </a>
//             <a
//               href="/signup"
//               className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
//             >
//               Sign Up
//             </a>
//           </div>
//         </nav>
//       </header>

//       {/* Hero Section */}
//       <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-24">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <h1 className="text-5xl md:text-6xl font-bold mb-4">Your Digital Cricket</h1>
//           <p className="text-xl md:text-2xl text-gray-300 mb-8">Cricket stadium wide hero image</p>
//           <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
//             Manage tournaments, organize matches, and connect with cricket enthusiasts worldwide
//           </p>
//           <div className="flex flex-wrap justify-center gap-4">
//             <a
//               href="/signup"
//               className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
//             >
//               Register Tournament
//             </a>
//             <a
//               href="/signin"
//               className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
//             >
//               Join as a Player
//             </a>
//             <button className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition">
//               Explore Teams
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Choose Your Role */}
//       <section className="py-16 px-4">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl font-bold text-center mb-4">Choose Your Role</h2>
//           <p className="text-center text-gray-600 mb-12">Join CricB as a player, organizer, manager, or fan</p>

//           <div className="grid md:grid-cols-4 gap-6">
//             {/* Organizer */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
//                 <span className="text-teal-600 text-xl">📋</span>
//               </div>
//               <h3 className="font-semibold text-lg mb-2 text-teal-600">Organizer</h3>
//               <p className="text-gray-600 text-sm mb-4">Host tournaments and manage registrations with ease</p>
//               <button className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
//                 Get Started
//               </button>
//             </div>

//             {/* Club Manager */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
//                 <span className="text-blue-600 text-xl">👥</span>
//               </div>
//               <h3 className="font-semibold text-lg mb-2 text-blue-600">Club Manager</h3>
//               <p className="text-gray-600 text-sm mb-4">Manage teams and coordinate team activities efficiently</p>
//               <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
//                 Get Started
//               </button>
//             </div>

//             {/* Player */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
//                 <span className="text-orange-600 text-xl">🏏</span>
//               </div>
//               <h3 className="font-semibold text-lg mb-2 text-orange-600">Player</h3>
//               <p className="text-gray-600 text-sm mb-4">Showcase your cricket skills and join tournaments</p>
//               <button className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
//                 Get Started
//               </button>
//             </div>

//             {/* Fan */}
//             <div className="bg-white border border-gray-200 rounded-lg p-6">
//               <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
//                 <span className="text-purple-600 text-xl">⭐</span>
//               </div>
//               <h3 className="font-semibold text-lg mb-2 text-purple-600">Fan</h3>
//               <p className="text-gray-600 text-sm mb-4">Follow tournaments and support your favorite teams</p>
//               <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
//                 Get Started
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Cricket by the Numbers */}
//       <section className="bg-gray-50 py-16 px-4">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl font-bold text-center mb-12">Cricket by the Numbers</h2>

//           <div className="grid md:grid-cols-4 gap-8">
//             <div className="text-center">
//               <div className="text-4xl font-bold text-teal-600 mb-2">1,250</div>
//               <p className="text-gray-600">Total Tournaments Hosted</p>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-blue-600 mb-2">450</div>
//               <p className="text-gray-600">Total Clubs Registered</p>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-orange-600 mb-2">15,000</div>
//               <p className="text-gray-600">Total Players with CricB</p>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-purple-600 mb-2">24+</div>
//               <p className="text-gray-600">Live Matches / Week</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Active & Upcoming Tournaments */}
//       <section className="py-16 px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex justify-between items-center mb-12">
//             <h2 className="text-3xl font-bold">Active & Upcoming Tournaments</h2>
//             <button className="text-teal-600 font-medium hover:text-teal-700">View All →</button>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6">
//             {[1, 2, 3].map((tournament) => (
//               <div key={tournament} className="bg-gray-900 rounded-lg overflow-hidden">
//                 <div className="bg-gray-700 h-40 flex items-center justify-center text-white">
//                   <span className="text-lg font-semibold">Match Photo</span>
//                 </div>
//                 <div className="p-4 text-white">
//                   <div className="inline-block bg-teal-600 px-3 py-1 rounded text-xs font-medium mb-3">Live</div>
//                   <h3 className="font-semibold mb-2">Tournament {tournament}</h3>
//                   <p className="text-gray-400 text-sm mb-4">Tournament details and schedule</p>
//                   <button className="px-4 py-2 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 w-full">
//                     Join Now
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Modals */}
//       {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
//       {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
//     </div>
//   )
// }
