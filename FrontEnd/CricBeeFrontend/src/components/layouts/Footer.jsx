"use client"

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4 mt-12 border-t border-blue-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-slate-900 px-3 py-1 rounded font-bold">CB</div>
              <span className="font-semibold">CricB</span>
            </div>
            <p className="text-gray-400 text-sm">
              All-in-one digital platform for scoring, streaming and managing grassroots cricket across India.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Tournaments
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Live Scores
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Clubs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Players
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cookies Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>© 2024 CricB. All rights reserved. Empowering cricket communities across India.</p>
        </div>
      </div>
    </footer>
  )
}