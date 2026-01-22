import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Github, Mail, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <img src="/concept 2.1.png" alt="BPI MetaWork" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <h3 className="text-2xl font-bold">BPI MetaWork</h3>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              ระบบจัดการและติดตามการแพ็คสินค้าอย่างมืออาชีพ 
              พร้อมการวิเคราะห์ข้อมูลแบบเรียลไทม์
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-slate-700 hover:bg-lavender-500 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@packingreport.com"
                className="w-10 h-10 bg-slate-700 hover:bg-peach-500 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-300 hover:text-lavender-300 transition-colors flex items-center gap-2"
                >
                  Dashboard
                  <ExternalLink className="w-4 h-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/dashboard?view=table')}
                  className="text-slate-300 hover:text-peach-300 transition-colors flex items-center gap-2"
                >
                  Data Table
                  <ExternalLink className="w-4 h-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/dashboard?view=input')}
                  className="text-slate-300 hover:text-mint-300 transition-colors flex items-center gap-2"
                >
                  Add Record
                  <ExternalLink className="w-4 h-4" />
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-lg mb-4">Resources</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-lavender-300 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-peach-300 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-mint-300 transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Packing Report. All rights reserved.
          </p>
          <p className="text-slate-400 text-sm mt-2 sm:mt-0">
            Built with ❤️ using React & Firebase
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
