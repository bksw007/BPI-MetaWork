import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package, BarChart3 } from 'lucide-react';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-pastel opacity-60"></div>
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-lavender-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-peach-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mint-200/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
            <Package className="w-10 h-10 text-lavender-500" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-800">
            Packing Report
            <span className="block text-4xl md:text-5xl lg:text-6xl mt-2 bg-gradient-to-r from-lavender-500 via-peach-400 to-coral-400 bg-clip-text text-transparent">
              Professional Tracking
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            ระบบจัดการและติดตามการแพ็คสินค้าอย่างมืออาชีพ 
            <span className="block mt-2 text-lg text-slate-500">
              ด้วยข้อมูลแบบเรียลไทม์และการวิเคราะห์ที่ครอบคลุม
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-pastel-primary text-lg px-8 py-4 flex items-center gap-2 group"
            >
              ดู Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/dashboard?view=input')}
              className="btn-pastel-secondary text-lg px-8 py-4 flex items-center gap-2 group"
            >
              <BarChart3 className="w-5 h-5" />
              เพิ่มข้อมูล
            </button>
          </div>

          {/* Stats preview */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-lavender-200/50">
              <div className="text-3xl font-bold text-lavender-600">100%</div>
              <div className="text-sm text-slate-600 mt-1">Real-time</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-peach-200/50">
              <div className="text-3xl font-bold text-peach-600">24/7</div>
              <div className="text-sm text-slate-600 mt-1">Accessible</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-mint-200/50">
              <div className="text-3xl font-bold text-mint-600">∞</div>
              <div className="text-sm text-slate-600 mt-1">Scalable</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
