'use client';

import { useState, useEffect } from 'react';

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: { message: string }[];
    action?: string;
    pull_request?: { title: string };
    issue?: { title: string };
  };
}

interface Win {
  id: string;
  text: string;
  date: string;
  category: 'work' | 'health' | 'personal' | 'learning';
}

const MOTIVATIONAL_QUOTES = [
  "Progress, not perfection. 🚀",
  "Small wins compound into big victories. 💪",
  "You're doing better than you think. ⭐",
  "Consistency beats intensity. 🎯",
  "Every step forward counts. 🏆",
  "Building momentum, one day at a time. 🔥",
  "The compound effect of daily wins is unstoppable. 💫",
];

const CATEGORY_COLORS = {
  work: 'bg-blue-500',
  health: 'bg-green-500',
  personal: 'bg-purple-500',
  learning: 'bg-orange-500',
};

const CATEGORY_EMOJIS = {
  work: '💼',
  health: '🏃',
  personal: '🌟',
  learning: '📚',
};

export default function Home() {
  const [githubEvents, setGithubEvents] = useState<GitHubEvent[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [newWin, setNewWin] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Win['category']>('work');
  const [loading, setLoading] = useState(true);
  const [quote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

  // Load wins from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('weekly-wins');
    if (stored) {
      setWins(JSON.parse(stored));
    }
  }, []);

  // Save wins to localStorage
  useEffect(() => {
    localStorage.setItem('weekly-wins', JSON.stringify(wins));
  }, [wins]);

  // Fetch GitHub events
  useEffect(() => {
    async function fetchGitHub() {
      try {
        const res = await fetch('https://api.github.com/users/nikilster/events?per_page=30');
        const data = await res.json();
        
        // Filter to last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentEvents = data.filter((event: GitHubEvent) => 
          new Date(event.created_at) > weekAgo
        );
        
        setGithubEvents(recentEvents);
      } catch (e) {
        console.error('Failed to fetch GitHub events:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchGitHub();
  }, []);

  const addWin = () => {
    if (!newWin.trim()) return;
    
    const win: Win = {
      id: Date.now().toString(),
      text: newWin,
      date: new Date().toISOString(),
      category: selectedCategory,
    };
    
    setWins([win, ...wins]);
    setNewWin('');
  };

  const deleteWin = (id: string) => {
    setWins(wins.filter(w => w.id !== id));
  };

  // Get week's wins count
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekWins = wins.filter(w => new Date(w.date) > weekAgo);
  
  // Get streak (consecutive days with wins)
  const getStreak = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasWin = wins.some(w => w.date.startsWith(dateStr));
      
      if (hasWin) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = getStreak();
  const commitCount = githubEvents.filter(e => e.type === 'PushEvent').reduce((acc, e) => 
    acc + (e.payload.commits?.length || 0), 0
  );

  const formatEventDescription = (event: GitHubEvent) => {
    switch (event.type) {
      case 'PushEvent':
        const commits = event.payload.commits || [];
        return `Pushed ${commits.length} commit${commits.length !== 1 ? 's' : ''}`;
      case 'PullRequestEvent':
        return `${event.payload.action} PR: ${event.payload.pull_request?.title}`;
      case 'IssuesEvent':
        return `${event.payload.action} issue: ${event.payload.issue?.title}`;
      case 'CreateEvent':
        return 'Created repository/branch';
      default:
        return event.type.replace('Event', '');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          🏆 Weekly Wins
        </h1>
        <p className="text-xl text-gray-300 italic">{quote}</p>
      </header>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-yellow-400">{thisWeekWins.length}</div>
            <div className="text-gray-300 mt-1">Wins This Week</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-green-400">{streak}🔥</div>
            <div className="text-gray-300 mt-1">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-blue-400">{commitCount}</div>
            <div className="text-gray-300 mt-1">Commits This Week</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Win Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ✨ Log a Win
            </h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={newWin}
                onChange={(e) => setNewWin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWin()}
                placeholder="What did you accomplish?"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(CATEGORY_COLORS) as Win['category'][]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? `${CATEGORY_COLORS[cat]} text-white shadow-lg scale-105`
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {CATEGORY_EMOJIS[cat]} {cat}
                  </button>
                ))}
              </div>
              
              <button
                onClick={addWin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 font-bold text-lg hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg hover:shadow-xl"
              >
                Add Win 🎉
              </button>
            </div>

            {/* Recent Wins */}
            <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
              {wins.slice(0, 10).map((win) => (
                <div
                  key={win.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group hover:bg-white/10 transition-all"
                >
                  <span className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[win.category]}`} />
                  <span className="flex-1">{win.text}</span>
                  <button
                    onClick={() => deleteWin(win.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub Activity */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🐙 GitHub Activity
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin text-4xl">🔄</div>
              </div>
            ) : githubEvents.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No recent GitHub activity</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {githubEvents.slice(0, 15).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400 font-medium text-sm">
                        {event.repo.name.split('/')[1]}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {formatEventDescription(event)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Stats */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">📊 Win Distribution</h2>
          <div className="grid grid-cols-4 gap-4">
            {(Object.keys(CATEGORY_COLORS) as Win['category'][]).map((cat) => {
              const count = thisWeekWins.filter(w => w.category === cat).length;
              return (
                <div key={cat} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${CATEGORY_COLORS[cat]} flex items-center justify-center text-2xl font-bold mb-2`}>
                    {count}
                  </div>
                  <div className="text-gray-300 capitalize">{CATEGORY_EMOJIS[cat]} {cat}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500">
          <p>Built with 💛 by Dave the Minion at 3am 🍌</p>
        </footer>
      </div>
    </div>
  );
}
