import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const DashboardPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-soft">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Dashboard Preview
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ดูภาพรวมของข้อมูลในรูปแบบที่เข้าใจง่าย พร้อมการวิเคราะห์ที่ครอบคลุม
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="card-pastel p-8 md:p-12 mb-8 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            {[
              { label: 'Total Products', value: '1,234', icon: TrendingUp, color: 'lavender' },
              { label: 'Packages Used', value: '856', icon: BarChart3, color: 'peach' },
              { label: 'Top Customer', value: 'Toyota', icon: PieChart, color: 'mint' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses: Record<string, string> = {
                lavender: 'bg-lavender-100 text-lavender-600',
                peach: 'bg-peach-100 text-peach-600',
                mint: 'bg-mint-100 text-mint-600',
              };
              return (
                <div key={index} className={`${colorClasses[stat.color]} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium opacity-75">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Chart Placeholder */}
          <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-lavender-200">
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-16 h-16 text-lavender-300 mb-4" />
              <p className="text-slate-400 text-lg font-medium">
                Interactive Charts & Analytics
              </p>
              <p className="text-slate-400 text-sm mt-2">
                View comprehensive data visualization in the full dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-pastel-primary text-lg px-8 py-4 inline-flex items-center gap-2 group"
          >
            เปิด Dashboard แบบเต็ม
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
