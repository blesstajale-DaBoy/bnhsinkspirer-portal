import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Sparkles, Send, BellRing, Heart } from 'lucide-react';
import { Category, NewsletterSubscriber } from '../types';

const STORAGE_KEY_SUBSCRIBERS = 'the_inkspirer_subscribers_v1';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<NewsletterSubscriber['role']>('Student');
  const [selectedBeats, setSelectedBeats] = useState<string[]>([
    'All',
    'News',
    'Features',
    'Opinion',
    'Sports',
    'Announcements',
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(342);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
      if (stored) {
        const list: NewsletterSubscriber[] = JSON.parse(stored);
        setSubscriberCount(342 + list.length);
      }
    } catch {
      // fallback
    }
  }, []);

  const toggleBeat = (beat: string) => {
    if (beat === 'All') {
      if (selectedBeats.includes('All')) {
        setSelectedBeats([]);
      } else {
        setSelectedBeats(['All', 'News', 'Features', 'Opinion', 'Sports', 'Announcements']);
      }
      return;
    }

    setSelectedBeats((prev) => {
      const exists = prev.includes(beat);
      const next = exists ? prev.filter((b) => b !== beat && b !== 'All') : [...prev, beat];
      return next;
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid school or personal email address.');
      return;
    }

    try {
      const newSub: NewsletterSubscriber = {
        id: `sub-${Date.now()}`,
        email: email.trim(),
        role,
        preferredBeats: selectedBeats as (Category | 'All')[],
        subscribedAt: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      const existingRaw = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
      const list: NewsletterSubscriber[] = existingRaw ? JSON.parse(existingRaw) : [];
      list.push(newSub);
      localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(list));

      setSubscriberCount((prev) => prev + 1);
      setIsSubmitted(true);
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setIsSubmitted(true);
    }
  };

  const resetForm = () => {
    setEmail('');
    setIsSubmitted(false);
    setErrorMessage('');
  };

  const beatOptions = [
    {
      id: 'All',
      label: 'All Stories',
      dot: 'bg-[#84CC16]', // Lime Green
      borderActive: 'border-[#84CC16] bg-[#84CC16]/20 text-[#A3E635]',
    },
    {
      id: 'News',
      label: 'News',
      dot: 'bg-[#FB923C]', // Pastel Orange
      borderActive: 'border-[#FB923C] bg-[#FB923C]/20 text-[#FDBA74]',
    },
    {
      id: 'Features',
      label: 'Features',
      dot: 'bg-[#38BDF8]', // Sky Blue
      borderActive: 'border-[#38BDF8] bg-[#38BDF8]/20 text-[#7DD3FC]',
    },
    {
      id: 'Opinion',
      label: 'Opinion',
      dot: 'bg-[#D4AF37]', // Imitation Gold
      borderActive: 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F3C562]',
    },
    {
      id: 'Sports',
      label: 'Sports',
      dot: 'bg-[#FACC15]', // Signal Yellow
      borderActive: 'border-[#FACC15] bg-[#FACC15]/20 text-[#FEF08A]',
    },
    {
      id: 'Announcements',
      label: 'Announcements',
      dot: 'bg-[#C084FC]', // Lilac
      borderActive: 'border-[#C084FC] bg-[#C084FC]/20 text-[#E9D5FF]',
    },
  ];

  return (
    <div className="bg-[#1A0306] border-b border-[#450C13] py-12 px-6 text-white relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#781423]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading & Value Proposition (6 cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34070E] border border-[#58111A] text-xs font-semibold text-[#D4AF37]">
              <BellRing className="w-3.5 h-3.5 text-[#F3C562]" />
              <span>The Inkspirer Monthly Digital Edition</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-300 font-normal">{subscriberCount} Readers Subscribed</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug">
              Sign Up for Digital Newsletter Highlights
            </h2>

            <p className="text-sm text-stone-300 leading-relaxed max-w-xl">
              Stay connected with Barobo National High School. Receive monthly digests featuring campus headlines, investigative student reporting, faculty honors, Blue Marlins sports, and administrative reminders delivered straight to your email.
            </p>

            {/* Publication promise */}
            <div className="pt-1 flex items-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                Zero Spam
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                Monthly 1st Monday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]" />
                DepEd RA 7079 Press
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Subscription Form (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-[#2D060B] border border-[#58111A] rounded-xl p-6 sm:p-7 shadow-xl">
              {isSubmitted ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Subscription Confirmed!
                  </h3>
                  <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                    You're now subscribed as a <strong className="text-white">{role}</strong> subscriber with <strong className="text-[#F3C562]">{email}</strong>. The next monthly BNHS publication digest will arrive on the first Monday of the upcoming month!
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:underline"
                    >
                      Subscribe another email address
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  {errorMessage && (
                    <div className="p-2.5 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
                      {errorMessage}
                    </div>
                  )}

                  {/* Email & Role Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email (e.g. name@deped.edu.ph)"
                        className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg bg-[#180306] border border-[#58111A] text-white placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as NewsletterSubscriber['role'])}
                        className="w-full px-3 py-2.5 text-xs rounded-lg bg-[#180306] border border-[#58111A] text-stone-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-medium"
                      >
                        <option value="Student">I am a Student</option>
                        <option value="Parent / Guardian">Parent / Guardian</option>
                        <option value="Faculty & Staff">Faculty / Teacher</option>
                        <option value="Alumni">BNHS Alumni</option>
                        <option value="Community Supporter">Community Reader</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-beat interest selection with exact requested menu colors */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Choose Your Highlight Topics:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {beatOptions.map((beat) => {
                        const isSelected = selectedBeats.includes(beat.id);
                        return (
                          <button
                            type="button"
                            key={beat.id}
                            onClick={() => toggleBeat(beat.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? beat.borderActive
                                : 'border-[#450C13] bg-[#1A0306] text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${beat.dot}`} />
                            <span>{beat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-400 text-center sm:text-left">
                      Free monthly delivery · Cancel anytime
                    </span>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-stone-950 bg-[#D4AF37] hover:bg-[#F3C562] rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shrink-0 cursor-pointer"
                    >
                      <span>Subscribe to Highlights</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
