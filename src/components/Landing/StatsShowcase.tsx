import React, { useEffect, useState } from 'react';
import { Package, Users, TrendingUp, Activity, Target, Zap, BarChart2, Shield } from 'lucide-react';

interface Stat {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  suffix?: string;
}

const StatsShowcase: React.FC = () => {
  const [countedStats, setCountedStats] = useState<Stat[]>([
    { icon: Package, value: 0, label: 'Jobs Tracked', color: 'lavender', suffix: '+' },
    { icon: Users, value: 0, label: 'Team Members', color: 'peach', suffix: '+' },
    { icon: TrendingUp, value: 0, label: 'Efficiency Rate', color: 'mint', suffix: '%' },
    { icon: Activity, value: 0, label: 'Reports Generated', color: 'powder', suffix: '+' },
  ]);

  useEffect(() => {
    const targets = [
      { icon: Package, value: 1250, label: 'Jobs Tracked', color: 'lavender', suffix: '+' },
      { icon: Users, value: 45, label: 'Team Members', color: 'peach', suffix: '+' },
      { icon: TrendingUp, value: 98, label: 'Efficiency Rate', color: 'mint', suffix: '%' },
      { icon: Activity, value: 856, label: 'Reports Generated', color: 'powder', suffix: '+' },
    ];

    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCountedStats(targets.map(stat => ({
        ...stat,
        value: Math.floor(stat.value * easeOut),
      })));

      if (currentStep >= steps) {
        setCountedStats(targets);
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    lavender: {
      bg: 'bg-lavender-100',
      text: 'text-lavender-600',
      border: 'border-lavender-200',
    },
    peach: {
      bg: 'bg-peach-100',
      text: 'text-peach-600',
      border: 'border-peach-200',
    },
    mint: {
      bg: 'bg-mint-100',
      text: 'text-mint-600',
      border: 'border-mint-200',
    },
    powder: {
      bg: 'bg-powder-100',
      text: 'text-powder-600',
      border: 'border-powder-200',
    },
  };

  const whyChooseUs = [
    { icon: Target, title: 'All-in-One Platform', description: 'รวมทุกอย่างไว้ที่เดียว ไม่ต้องสลับหลายระบบ', color: 'lavender' },
    { icon: Zap, title: 'Real-time Updates', description: 'เห็นสถานะงานทันที ไม่พลาดทุกความเคลื่อนไหว', color: 'peach' },
    { icon: BarChart2, title: 'Smart Analytics', description: 'วิเคราะห์ประสิทธิภาพและการใช้วัสดุอัตโนมัติ', color: 'mint' },
    { icon: Shield, title: 'Secure & Reliable', description: 'ข้อมูลปลอดภัยด้วย Firebase Cloud', color: 'powder' },
  ];

  return (
    <>
      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-lavender-50 via-white to-peach-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              ทำไมต้องเลือก MetaWork?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              ระบบจัดการงานแพ็คที่ออกแบบมาเพื่อทีมของคุณโดยเฉพาะ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon;
              const colors = colorClasses[item.color];
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up text-center"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${colors.bg} ${colors.text} rounded-xl mb-4`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              Key Statistics
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              ตัวเลขสำคัญที่แสดงประสิทธิภาพและผลการดำเนินงาน
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {countedStats.map((stat, index) => {
              const Icon = stat.icon;
              const colors = colorClasses[stat.color];
              return (
                <div
                  key={index}
                  className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${colors.text} bg-white rounded-xl mb-4`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className={`text-5xl font-bold ${colors.text} mb-2`}>
                    {stat.value.toLocaleString()}{stat.suffix}
                  </div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default StatsShowcase;

