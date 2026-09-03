import { Cpu, Wrench, Trophy, Users } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Cpu,
      title: 'VEX V5 Robotics',
      description: 'We compete in the VEX V5 Robotics Competition, designing, building, and programming robots to complete challenging tasks.',
    },
    {
      icon: Wrench,
      title: 'Hands-On Engineering',
      description: 'Students gain real-world experience in mechanical engineering, electrical systems, and software development through robot design.',
    },
    {
      icon: Trophy,
      title: 'Competitive Excellence',
      description: 'Our team trains year-round to compete at regional and state-level tournaments, striving for excellence in every match.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Students work together in a collaborative environment, developing leadership, communication, and problem-solving skills.',
    },
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">About Our Team</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Talon Tech is the VEX V5 robotics team at Lakewood Ranch Preparatory Academy.
            We are passionate about engineering, competition, and building the future of robotics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card h-full text-center group">
              <div className="w-14 h-14 bg-brand-navy/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-navy/10 transition-colors">
                <feature.icon className="text-brand-navy" size={28} />
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
