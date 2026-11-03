import React, { useState } from 'react';
import {
  X,
  Download,
  Send,
  Feather,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Category, StorySubmission, PublicationCategory } from '../types';
import { downloadSubmissionTextFile } from '../utils/exporter';

interface SubmitStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<StorySubmission, 'id' | 'submittedAt' | 'status'>) => StorySubmission;
  onOpenEditorialDesk: () => void;
  categories?: PublicationCategory[];
}

export const SubmitStoryModal: React.FC<SubmitStoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onOpenEditorialDesk,
  categories,
}) => {
  const [studentName, setStudentName] = useState('');
  const [gradeSection, setGradeSection] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<Category>('Features');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [notesToEditor, setNotesToEditor] = useState('');
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<StorySubmission | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFillSample = () => {
    setStudentName('Bea Katrina Rosales');
    setGradeSection('Grade 11 STEM - Emerald');
    setEmail('b.rosales@bnhs.deped.edu.ph');
    setCategory('Features');
    setHeadline('Green Wings: Barobo High’s Youth Birding Club Maps Local Coastal Biodiversity');
    setSummary('Student environmentalists document over 32 migratory bird species flourishing along the Barobo riverbanks and mangrove forest reserves.');
    setContent(
      'Equipped with binoculars loaned by the local tourism office and field notebooks, members of the Barobo NHS Youth Environmental Club embarked on a series of weekend bird-counting expeditions along our town’s coastal marshes.\n\nOver four Saturdays, the student observers cataloged 32 distinct avian species, including the vulnerable Chinese Egret and the Philippine Duck feeding along the tidal sandbars.\n\n“Observing these creatures in their native habitat transformed our science textbook lessons into vivid reality,” shared team leader Miguel Dela Cruz. “It shows that Barobo is not just our home, but a vital sanctuary for international biodiversity.”\n\nThe club plans to present its findings to the Barobo Sangguniang Bayan during the upcoming National Environmental Awareness Month.'
    );
    setNotesToEditor('I have high-resolution photos taken with our school camera if approved for publication.');
    setErrorMsg('');
  };

  const handleDownloadTxt = () => {
    if (!headline.trim() || !studentName.trim() || !content.trim()) {
      setErrorMsg('Please fill in your Student Name, Proposed Headline, and Article Body before downloading.');
      return;
    }
    setErrorMsg('');
    downloadSubmissionTextFile({
      studentName,
      gradeSection: gradeSection || 'Not specified',
      email: email || 'student@bnhs.deped.edu.ph',
      category,
      headline,
      summary: summary || headline,
      content,
      notesToEditor,
    });
  };

  const handleSubmitToDesk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !headline.trim() || !content.trim()) {
      setErrorMsg('Please fill in your name, headline, and article story.');
      return;
    }

    const created = onSubmit({
      studentName,
      gradeSection: gradeSection || 'BNHS Student Contributor',
      email: email || 'student@bnhs.deped.edu.ph',
      category,
      headline,
      summary: summary || headline,
      content,
      notesToEditor,
    });

    setLastSubmission(created);
    setSubmittedSuccessfully(true);
    setErrorMsg('');
  };

  const handleResetForm = () => {
    setStudentName('');
    setGradeSection('');
    setEmail('');
    setHeadline('');
    setSummary('');
    setContent('');
    setNotesToEditor('');
    setSubmittedSuccessfully(false);
    setLastSubmission(null);
    setErrorMsg('');
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex justify-center p-3 sm:p-6">
      <div className="bg-white text-[#1C1917] w-full max-w-2xl rounded-lg shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-[#0B2545] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#D4AF37]">
                Barobo National High School · Campus Press
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight">
                Submit a Story to The Inkspirer
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {submittedSuccessfully && lastSubmission ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Manuscript Received by Editorial Desk!
              </h3>

              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{lastSubmission.studentName}</strong>! Your proposed {lastSubmission.category} article titled{' '}
                <strong className="text-stone-800">“{lastSubmission.headline}”</strong> has been registered in The Inkspirer’s editorial review system.
              </p>

              <div className="bg-stone-50 border border-stone-200 rounded p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Submission ID:</span>
                  <span className="font-mono text-stone-700">{lastSubmission.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Pending Editorial Review
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Publication Adviser:</span>
                  <span className="text-stone-800">Mrs. Maria Elena Delos Reyes</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleDownloadTxt}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-stone-600" />
                  <span>Download Backup Manuscript (.txt)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenEditorialDesk();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center gap-1.5"
                >
                  <span>Open Editorial Desk to Review & Publish</span>
                </button>
              </div>

              <button
                onClick={handleResetForm}
                className="text-xs text-stone-500 hover:underline pt-2"
              >
                Submit another story proposal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitToDesk} className="space-y-5">
              {/* Guidance Ribbon */}
              <div className="bg-[#FBF9F5] border border-stone-200 rounded p-4 flex items-start gap-3 text-xs text-stone-600">
                <HelpCircle className="w-4 h-4 text-[#133E87] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="text-stone-800">For Aspiring Student Journalists & Writers:</strong> You can download your article as a formatted text file (.txt) OR submit directly to the live editorial desk for publication review!
                </div>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-xs font-semibold text-[#133E87] hover:underline shrink-0 whitespace-nowrap"
                >
                  Load Sample Article
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {errorMsg}
                </div>
              )}

              {/* Author Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Student Writer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Maria Angela Santos"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Grade & Section / Track
                  </label>
                  <input
                    type="text"
                    value={gradeSection}
                    onChange={(e) => setGradeSection(e.target.value)}
                    placeholder="e.g. Grade 11 STEM - Emerald"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Student Email / DepEd Account
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@bnhs.deped.edu.ph"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Target Publication Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none font-medium"
                  >
                    {categories && categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.description ? `(${c.description.slice(0, 40)}...)` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="News">News (School events & campus updates)</option>
                        <option value="Features">Features (People, stories & achievements)</option>
                        <option value="Opinion">Opinion (Student perspectives & editorials)</option>
                        <option value="Sports">Sports (Teams, competitions & victories)</option>
                        <option value="Announcements">Announcements (Notices & reminders)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Proposed Headline */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Proposed Article Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Behind the Corridors: How BNHS Scholars Balance Passion and Academics"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-serif text-sm focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Summary / Catchy Deck */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Summary / Catchy Deck (1–2 sentences)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A quick summary of why this story matters to the student body..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Story Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Full Article Manuscript / Story Body <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400 tabular-nums">
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  required
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste your article here. Separate paragraphs with double enter..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded font-sans leading-relaxed focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Notes to Adviser */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes to Publication Adviser & Editors (Optional)
                </label>
                <input
                  type="text"
                  value={notesToEditor}
                  onChange={(e) => setNotesToEditor(e.target.value)}
                  placeholder="e.g. Sources interviewed, available photos, suggestions for layout..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-[#0B2545] focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              {/* Dual Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>Download .txt File</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-1/2 sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E87] rounded transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Editorial Desk</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
