import React from 'react';
import { BarChart3, Clock, FileText, Download, Filter, TrendingUp, Shield, Zap } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'ติดตามข้อมูลแบบเรียลไทม์พร้อมกราฟและสถิติที่ครอบคลุม',
      color: 'lavender',
    },
    {
      icon: FileText,
      title: 'Easy Data Entry',
      description: 'ฟอร์มการบันทึกข้อมูลที่ใช้งานง่าย รวดเร็ว และแม่นยำ',
      color: 'peach',
    },
    {
      icon: Download,
      title: 'Export & Report',
      description: 'ส่งออกข้อมูลเป็น CSV เพื่อการรายงานและวิเคราะห์',
      color: 'mint',
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'กรองข้อมูลตามวันที่ ลูกค้า สินค้า และหมวดหมู่ต่างๆ',
      color: 'powder',
    },
    {
      icon: TrendingUp,
      title: 'Performance Insights',
      description: 'วิเคราะห์อัตราการใช้บรรจุภัณฑ์และประสิทธิภาพการทำงาน',
      color: 'rose',
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'ระบบที่รวดเร็ว ปลอดภัย และเชื่อถือได้ด้วย Firebase',
      color: 'golden',
    },
  ];

  const colorClasses: Record<string, string> = {
    lavender: 'bg-lavender-100 text-lavender-600 border-lavender-200',
    peach: 'bg-peach-100 text-peach-600 border-peach-200',
    mint: 'bg-mint-100 text-mint-600 border-mint-200',
    powder: 'bg-powder-100 text-powder-600 border-powder-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200',
    golden: 'bg-golden-100 text-golden-600 border-golden-200',
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Features
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            เครื่องมือครบครันสำหรับการจัดการและวิเคราะห์ข้อมูลการแพ็คสินค้า
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-pastel p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border-2 ${colorClasses[feature.color]}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
