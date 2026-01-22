import React from 'react';
import { BarChart3, PieChart, TrendingUp, Package, ClipboardCheck, Layers } from 'lucide-react';

const DashboardPreview: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-soft">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Dashboard Preview
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ดูภาพรวมงานแพ็ค ติดตามสถานะ และวิเคราะห์ประสิทธิภาพได้ในที่เดียว
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="card-pastel p-8 md:p-12 animate-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            {[
              { label: 'งานทั้งหมด', value: '1,234', icon: Package, color: 'lavender' },
              { label: 'กำลังดำเนินการ', value: '48', icon: ClipboardCheck, color: 'peach' },
              { label: 'เสร็จสิ้นวันนี้', value: '156', icon: TrendingUp, color: 'mint' },
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
              <div className="flex gap-4 mb-4">
                <BarChart3 className="w-12 h-12 text-lavender-300" />
                <PieChart className="w-12 h-12 text-peach-300" />
                <Layers className="w-12 h-12 text-mint-300" />
              </div>
              <p className="text-slate-500 text-lg font-medium">
                Interactive Charts & Analytics
              </p>
              <p className="text-slate-400 text-sm mt-2">
                กราฟแสดงข้อมูลการแพ็ค วัสดุที่ใช้ และประสิทธิภาพการทำงาน
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;

