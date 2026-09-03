

export default function Team() {
  const members = [
    { name: 'Arnav Sanghvi', role: 'President & Team Captain' },
    { name: 'Declan Rzepa', role: 'Vice President & Lead Engineer' },
    { name: 'Jacob Lopez', role: 'Treasurer & Lead of Engineering Documentation' },
    { name: 'Julian Baczewski', role: 'Secretary & Lead Programmer' },
    { name: 'Ethan Ramos', role: 'Marketing Director & Lead Analyst' },
    { name: 'David Cuellar', role: 'Lead Driver' },
    { name: 'Sugaraj Fernando', role: 'Assistant Engineer' },
    { name: 'Abayode Bankole', role: 'Assistant Engineer' },
     { name: 'Yavid', role: 'Engineering Documentation' },
  ];

  return (
    <section id="team" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Meet the Team</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our dedicated students work together to design, build, and compete with robots at the highest level.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.name} className="card h-full flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-brand-navy to-brand-navy-light rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-brand-navy">{member.name}</h3>
                <p className="text-brand-gold text-sm font-medium">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
