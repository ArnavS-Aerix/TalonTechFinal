import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Faq = { id: string; question: string; answer: string; sort_order: number };

export default function Faq() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('faqs')
        .select('id, question, answer, sort_order')
        .order('sort_order', { ascending: true });
      setFaqs((data ?? []) as Faq[]);
    })();
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">
            Got Questions?
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = open === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-xl border transition-all overflow-hidden ${
                  isOpen ? 'border-brand-gold/40 shadow-md' : 'border-gray-100 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-brand-navy text-sm md:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-brand-gold shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-gray-600 text-sm leading-relaxed px-5 pb-5 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
