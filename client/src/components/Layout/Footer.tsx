import { GraduationCap, Twitter, Linkedin, Github, ArrowUpRight, Heart } from 'lucide-react';
import EdusphereLogo from '@/assets/Edusphere.png';
import { Link } from 'wouter';

export function Footer() {
  // Only include links to pages that actually exist in the project
  const quickLinks = [
    { href: '/rooms', label: 'Study Rooms' },
    { href: '/ai-assistant', label: 'AI Assistant' },
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
  ];

  const resourceLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore Rooms' },
    { href: '/create-room', label: 'Create Room' },
  ];

  // Remove social links since they don't have real URLs
  const socialLinks = [
    { href: 'https://twitter.com/edusphere', icon: Twitter, label: 'Twitter' },
    { href: 'https://linkedin.com/company/edusphere', icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://github.com/edusphere', icon: Github, label: 'GitHub' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Company Info - Enhanced */}
          <div className="md:col-span-1">
            <Link href="/" className="group flex items-center space-x-3 mb-6 transition-all duration-300 hover:scale-105" data-testid="footer-logo">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300 p-2">
                <img 
                  src={EdusphereLogo} 
                  alt="Edusphere Logo" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors duration-300">EduSphere</span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-8 text-lg hover:text-white transition-colors duration-300 cursor-default">
              Empowering students worldwide through AI-enhanced collaborative learning experiences.
            </p>
            
            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Connect With Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary-600 hover:scale-110 hover:rotate-6 hover:shadow-lg hover:shadow-primary-600/25 transition-all duration-300 transform"
                      data-testid={`social-${social.label.toLowerCase()}`}
                      aria-label={social.label}
                    >
                      <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 relative group cursor-default text-lg">
              Quick Links
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></div>
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between hover:text-white hover:translate-x-2 transition-all duration-300 hover:bg-gray-800/50 hover:px-4 hover:py-2 hover:rounded-lg text-base"
                    data-testid={`quick-link-${link.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6 relative group cursor-default text-lg">
              Resources
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></div>
            </h3>
            <ul className="space-y-4">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between hover:text-white hover:translate-x-2 transition-all duration-300 hover:bg-gray-800/50 hover:px-4 hover:py-2 hover:rounded-lg text-base"
                    data-testid={`resource-link-${link.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
            
           
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-400 hover:text-white transition-colors duration-300 cursor-default text-center md:text-left">
                © 2025 EduSphere. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <Link href="/login" className="hover:text-white transition-colors duration-300">Login</Link>
                <Link href="/register" className="hover:text-white transition-colors duration-300">Sign Up</Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
            
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
