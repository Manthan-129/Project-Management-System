import { Github, Linkedin, Mail, Sparkles, Twitter } from 'lucide-react'

const socialLinks = [
  { label: 'GitHub', icon: <Github size={16} /> },
  { label: 'Twitter', icon: <Twitter size={16} /> },
  { label: 'LinkedIn', icon: <Linkedin size={16} /> },
  { label: 'Email', icon: <Mail size={16} /> },
]

const footerLinks = [
  {
    heading: 'Product',
    links: ['Features', 'Pricing', 'Roadmap', 'Release Notes'],
  },
  {
    heading: 'Company',
    links: ['About', 'Careers', 'Security', 'Contact'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'API Reference', 'Help Center', 'System Status'],
  },
]

const Footer = () => {
  return (
    <footer className="bg-[#0f1f34] px-5 py-16 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#1c3555] rounded-lg border border-[#2c4b71]">
                <Sparkles size={18} className="text-[#8fb2d9]" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Dev<span className="text-[#8fb2d9]">Dash</span>
              </h2>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              A calm, focused platform for teams that want stronger execution from planning to pull request delivery.
            </p>

            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white bg-[#1b314d] hover:bg-[#315e8d] rounded-lg transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{col.heading}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors no-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#2b4567]">
          <p className="text-xs text-slate-300">Copyright 2026 DevDash. All rights reserved.</p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a key={item} href="#" className="text-xs text-slate-300 hover:text-white transition-colors no-underline">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
