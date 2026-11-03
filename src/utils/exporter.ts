import { Article, Announcement, StorySubmission } from '../types';

export function downloadSubmissionTextFile(submission: {
  studentName: string;
  gradeSection: string;
  email: string;
  category: string;
  headline: string;
  summary: string;
  content: string;
  notesToEditor?: string;
}) {
  const content = `================================================================================
THE INKSPIRER - BAROBO NATIONAL HIGH SCHOOL
OFFICIAL STUDENT JOURNALISM MANUSCRIPT SUBMISSION
================================================================================

SUBMISSION METADATA:
--------------------
Date Generated      : ${new Date().toLocaleString()}
Student Author      : ${submission.studentName}
Grade & Section     : ${submission.gradeSection}
Contact / Email     : ${submission.email}
Target Category     : [ ${submission.category.toUpperCase()} ]
Target Publication  : The Inkspirer (Official Digital Newsletter)
School              : Barobo National High School, Surigao del Sur

PROPOSED HEADLINE:
------------------
${submission.headline}

SUMMARY / CATCHY DECK:
----------------------
${submission.summary}

ARTICLE MANUSCRIPT:
-------------------
${submission.content}

NOTES TO PUBLICATION ADVISER & EDITORIAL BOARD:
----------------------------------------------
${submission.notesToEditor || 'No additional notes provided.'}

================================================================================
CONFIDENTIALITY & ETHICS NOTICE:
By submitting this article, the author verifies that this is an original piece of 
campus journalism, adheres to the Journalist's Code of Ethics, and complies with 
the editorial policies of Barobo National High School.
================================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedHeadline = (submission.headline || 'untitled-story')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  link.href = url;
  link.download = `inkspirer-submission-${sanitizedHeadline}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadStandaloneWebsiteHtml(
  articles: Article[],
  announcements: Announcement[]
) {
  const articlesWithCalculatedTimes = articles.map((article) => {
    const contentString = Array.isArray(article.content)
      ? article.content.join(' ')
      : typeof article.content === 'string'
      ? article.content
      : '';
    const totalWords = `${article.title || ''} ${article.deck || ''} ${contentString} ${article.pullQuote || ''}`
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const calculatedMinutes = Math.max(1, Math.ceil(totalWords / 200));
    return {
      ...article,
      readTime: `${calculatedMinutes} min read`,
    };
  });

  const articlesJson = JSON.stringify(articlesWithCalculatedTimes).replace(/</g, '\\u003c');
  const announcementsJson = JSON.stringify(announcements).replace(/</g, '\\u003c');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Inkspirer | Barobo National High School Official Newsletter</title>
  <meta name="description" content="The official digital newsletter portal for Barobo National High School. Ideas in ink. Voices in motion.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            bnhsMaroon: '#4A0E17',
            bnhsDarkMaroon: '#34070E',
            bnhsGold: '#D4AF37',
            bnhsLightGold: '#F3C562',
          },
          fontFamily: {
            brand: ['Cinzel', 'serif'],
            serif: ['Playfair Display', 'Georgia', 'serif'],
            sans: ['Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #4A0E17; color: #1C1917; }
    h1, h2, h3, .font-serif { font-family: 'Playfair Display', Georgia, serif; }
    .font-brand { font-family: 'Cinzel', serif; }
    .first-letter-drop:first-letter {
      float: left;
      font-size: 3.5rem;
      line-height: 0.85;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      margin-right: 0.65rem;
      color: #781423;
    }
  </style>
</head>
<body class="min-h-screen antialiased flex flex-col bg-[#4A0E17]">
  <!-- Reading Progress Bar -->
  <div id="readProgressBar" class="fixed top-0 left-0 right-0 h-1.5 bg-[#D4AF37] z-50 transition-all duration-75" style="width: 0%;"></div>

  <!-- Top Bar -->
  <header class="border-b border-[#58111A] bg-[#34070E]/95 sticky top-0 z-40 px-6 py-3.5 backdrop-blur-sm text-white">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-8">
      <a href="#" class="font-brand text-lg font-bold tracking-wider text-[#F3C562] whitespace-nowrap flex items-center gap-2">
        <span>The Inkspirer</span>
      </a>
      <div class="text-xs text-stone-300 font-medium hidden md:block">
        BAROBO NATIONAL HIGH SCHOOL · OFFICIAL DIGITAL NEWSLETTER
      </div>
      <div class="text-xs text-stone-200 bg-[#4A0E17] px-3 py-1.5 rounded border border-[#6B1420]">
        Standalone Offline Edition
      </div>
    </div>
  </header>

  <!-- Masthead -->
  <section class="max-w-7xl mx-auto px-6 pt-10 pb-6 text-center w-full text-white">
    <!-- BNHS Logo above Barobo National High School -->
    <div class="flex justify-center mb-3">
      <img src="./assets/aistudio/BNHS_LOGO_29bb7e4c.jpg" onerror="this.src='/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg'" alt="Barobo National High School" class="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full border-2 border-[#D4AF37] p-0.5 bg-white/10 shadow-lg" />
    </div>
    <div class="text-xs uppercase tracking-widest text-[#F3C562] font-semibold mb-3">
      Barobo National High School · Surigao del Sur · Region XIII Caraga
    </div>
    <!-- Inkspirer Quill Emblem above THE INKSPIRER -->
    <div class="flex justify-center mb-2">
      <div class="w-12 h-12 rounded-full bg-[#240408] border-2 border-[#D4AF37] flex items-center justify-center text-xl shadow-md">
        ✒️
      </div>
    </div>
    <h1 class="font-brand text-4xl sm:text-6xl font-black tracking-tight text-white border-b-2 border-[#D4AF37] pb-3 mb-2">
      THE INKSPIRER
    </h1>
    <p class="font-serif italic text-lg text-stone-100">
      “Ideas in ink. Voices in motion.”
    </p>
    <div class="mt-4 flex items-center justify-between text-xs text-stone-300 border-t border-b border-[#58111A] py-2">
      <span>Vol. XXIV · Issue No. 1</span>
      <span>Official School Publication</span>
      <span>Barobo, Surigao del Sur</span>
    </div>
  </section>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-6 py-8 flex-1 w-full" id="appRoot">
    <!-- Announcements Ribbon -->
    <div class="mb-10 bg-[#0B2545] text-white p-5 rounded-lg">
      <div class="text-xs font-semibold tracking-wider text-[#D4AF37] uppercase mb-1">
        Official Campus Bulletin
      </div>
      <div id="bulletinBox" class="text-sm"></div>
    </div>

    <!-- Category Filter & Search -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#58111A]">
      <div class="flex flex-wrap gap-2" id="filterButtons">
        <button onclick="setCategory('All')" class="cat-btn px-4 py-1.5 text-xs font-bold rounded border border-[#84CC16] bg-[#84CC16] text-[#142304]" data-cat="All">● All Stories</button>
        <button onclick="setCategory('News')" class="cat-btn px-4 py-1.5 text-xs font-semibold rounded border border-[#FB923C]/50 bg-[#240408] text-[#FDBA74] hover:bg-[#FB923C]/20" data-cat="News">● News</button>
        <button onclick="setCategory('Features')" class="cat-btn px-4 py-1.5 text-xs font-semibold rounded border border-[#38BDF8]/50 bg-[#240408] text-[#7DD3FC] hover:bg-[#38BDF8]/20" data-cat="Features">● Features</button>
        <button onclick="setCategory('Opinion')" class="cat-btn px-4 py-1.5 text-xs font-semibold rounded border border-[#D4AF37]/50 bg-[#240408] text-[#F3C562] hover:bg-[#D4AF37]/20" data-cat="Opinion">● Opinion</button>
        <button onclick="setCategory('Sports')" class="cat-btn px-4 py-1.5 text-xs font-semibold rounded border border-[#FACC15]/50 bg-[#240408] text-[#FEF08A] hover:bg-[#FACC15]/20" data-cat="Sports">● Sports</button>
        <button onclick="setCategory('Announcements')" class="cat-btn px-4 py-1.5 text-xs font-semibold rounded border border-[#C084FC]/50 bg-[#240408] text-[#E9D5FF] hover:bg-[#C084FC]/20" data-cat="Announcements">● Announcements</button>
      </div>
      <input type="text" id="searchInput" oninput="handleSearch()" placeholder="Search stories, authors..." class="px-3.5 py-1.5 text-xs border border-[#58111A] rounded bg-[#28050B] text-white placeholder:text-stone-400 w-full md:w-64 focus:outline-none focus:border-[#D4AF37]" />
    </div>

    <!-- Stories Container -->
    <div id="storiesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
  </main>

  <!-- Newsletter Signup Component -->
  <section class="bg-[#1A0306] border-t border-b border-[#450C13] py-10 px-6 text-white text-center">
    <div class="max-w-xl mx-auto space-y-3">
      <div class="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">The Inkspirer Monthly Digest</div>
      <h3 class="font-serif text-2xl font-bold">Subscribe to Monthly Publication Highlights</h3>
      <p class="text-xs text-stone-300">Receive curated student news, campus features, sports recaps, and school circulars in your inbox on the 1st Monday of every month.</p>
      <form onsubmit="alert('Thank you for subscribing to The Inkspirer! You will receive monthly highlights.'); return false;" class="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input type="email" required placeholder="Enter your email address..." class="flex-1 px-3 py-2 text-xs rounded bg-[#2D060B] border border-[#58111A] text-white focus:outline-none focus:border-[#D4AF37]" />
        <button type="submit" class="px-4 py-2 text-xs font-bold rounded bg-[#D4AF37] text-stone-900 hover:bg-[#F3C562]">Subscribe</button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-[#240408] text-stone-400 text-xs py-10 px-6 border-t border-[#450C13]">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <div class="font-brand text-stone-200 font-bold tracking-wide">THE INKSPIRER</div>
        <p class="mt-1">Barobo National High School · Poblacion, Barobo, Surigao del Sur</p>
      </div>
      <div class="text-stone-400">
        © ${new Date().getFullYear()} The Inkspirer · Barobo National High School. All rights reserved.
      </div>
    </div>
    <div class="max-w-7xl mx-auto mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#E6C687] font-medium tracking-wide">
      The Inkspirer - BNHS Publication Portal developed by: <span class="text-white font-semibold underline decoration-[#D4AF37] underline-offset-4">Bless T. Tajale</span>
    </div>
  </footer>

  <script>
    const articles = ${articlesJson};
    const announcements = ${announcementsJson};
    let currentCategory = 'All';
    let searchQuery = '';

    const colorConfig = {
      All: { active: 'bg-[#84CC16] text-[#142304] border-[#84CC16]', idle: 'border-[#84CC16]/50 bg-[#240408] text-[#A3E635]' },
      News: { active: 'bg-[#FB923C] text-[#2D1204] border-[#FB923C]', idle: 'border-[#FB923C]/50 bg-[#240408] text-[#FDBA74]' },
      Features: { active: 'bg-[#38BDF8] text-[#06202E] border-[#38BDF8]', idle: 'border-[#38BDF8]/50 bg-[#240408] text-[#7DD3FC]' },
      Opinion: { active: 'bg-[#D4AF37] text-[#2A1B02] border-[#D4AF37]', idle: 'border-[#D4AF37]/50 bg-[#240408] text-[#F3C562]' },
      Sports: { active: 'bg-[#FACC15] text-[#2E2002] border-[#FACC15]', idle: 'border-[#FACC15]/50 bg-[#240408] text-[#FEF08A]' },
      Announcements: { active: 'bg-[#C084FC] text-[#220738] border-[#C084FC]', idle: 'border-[#C084FC]/50 bg-[#240408] text-[#E9D5FF]' }
    };

    // Render Bulletin
    const bulletinEl = document.getElementById('bulletinBox');
    if (bulletinEl && announcements.length > 0) {
      bulletinEl.innerHTML = announcements.map(a => 
        '<div class="py-1 border-b border-white/10 last:border-0"><strong class="text-[#D4AF37]">' + a.title + ':</strong> ' + a.content + '</div>'
      ).join('');
    }

    function setCategory(cat) {
      currentCategory = cat;
      document.querySelectorAll('.cat-btn').forEach(btn => {
        const bCat = btn.getAttribute('data-cat');
        const cfg = colorConfig[bCat] || colorConfig.All;
        if (bCat === cat) {
          btn.className = 'cat-btn px-4 py-1.5 text-xs font-bold rounded border shadow-sm ' + cfg.active;
        } else {
          btn.className = 'cat-btn px-4 py-1.5 text-xs font-semibold rounded border ' + cfg.idle;
        }
      });
      renderStories();
    }

    function handleSearch() {
      searchQuery = document.getElementById('searchInput').value.toLowerCase();
      renderStories();
    }

    function renderStories() {
      const container = document.getElementById('storiesContainer');
      const filtered = articles.filter(art => {
        const matchesCat = currentCategory === 'All' || art.category === currentCategory;
        const matchesQuery = !searchQuery || 
          art.title.toLowerCase().includes(searchQuery) ||
          art.deck.toLowerCase().includes(searchQuery) ||
          art.author.toLowerCase().includes(searchQuery);
        return matchesCat && matchesQuery;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-stone-500 text-sm">No stories found matching your filter criteria.</div>';
        return;
      }

      container.innerHTML = filtered.map(art => {
        return '<article class="bg-white border border-stone-200 rounded p-6 flex flex-col justify-between shadow-xs hover:border-stone-400 transition-colors">' +
          '<div>' +
            '<div class="flex items-center gap-2 text-xs text-stone-500 mb-2">' +
              '<span class="font-semibold text-[#133E87]">' + art.category + '</span>' +
              '<span>·</span>' +
              '<span>' + art.date + '</span>' +
              '<span>·</span>' +
              '<span>' + art.readTime + '</span>' +
            '</div>' +
            '<h2 class="font-serif text-xl font-bold text-stone-900 leading-snug mb-2">' + art.title + '</h2>' +
            '<p class="text-stone-600 text-sm leading-relaxed mb-4">' + art.deck + '</p>' +
            (art.pullQuote ? '<blockquote class="italic text-xs font-serif text-stone-700 border-t border-b border-stone-100 py-2 my-3">' + art.pullQuote + '</blockquote>' : '') +
          '</div>' +
          '<div class="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">' +
            '<span>By <strong class="text-stone-800">' + art.author + '</strong></span>' +
            '<span>' + art.issue + '</span>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    renderStories();

    // Scroll-Linked Reading Progress Bar
    window.addEventListener('scroll', function() {
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      var bar = document.getElementById('readProgressBar');
      if (bar) bar.style.width = Math.min(100, Math.max(0, p)) + '%';
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'the-inkspirer-barobo-nhs.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
