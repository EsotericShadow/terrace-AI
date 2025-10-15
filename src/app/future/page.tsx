'use client';

import { ArrowLeft, Zap, Globe, Users, Brain, TrendingUp, Shield, Heart } from 'lucide-react';
import Link from 'next/link';

export default function FuturePlans() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Terrace AI
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
            The Future of Terrace AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
            From a helpful chatbot to the <span className="font-bold text-blue-600">central nervous system</span> of our community
          </p>
        </div>

        {/* Phase Cards */}
        <div className="space-y-12 mb-20">
          {/* Phase 1 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Phase 1: Real-Time Intelligence</h2>
                <p className="text-gray-500">0-6 Months</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🔌 BC Hydro Integration</h3>
                <p className="text-gray-600">Live power outage notifications. "Is the power out in my area?" → Instant answer with restoration time.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🗺️ Interactive Maps</h3>
                <p className="text-gray-600">Topological understanding. Flood zones, service areas, business locations, trail maps.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">📰 News Integration</h3>
                <p className="text-gray-600">Terrace Standard, CFTK radio, City press releases auto-ingested daily.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🚨 Service Alerts</h3>
                <p className="text-gray-600">Road closures, water advisories, facility hours, garbage schedules.</p>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-green-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Phase 2: Community Empowerment</h2>
                <p className="text-gray-500">6-12 Months</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🏢 Premium Business Profiles</h3>
                <p className="text-gray-600">Businesses claim listings, add photos, services, live availability. <span className="font-bold text-green-600">$30/month</span></p>
                <div className="bg-green-50 p-4 rounded-lg mt-2">
                  <p className="text-sm font-bold text-green-900">Revenue Potential:</p>
                  <p className="text-sm text-green-700">240 businesses (20% adoption) = <span className="text-2xl font-bold text-green-600">$86,400/year</span></p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">📸 Document & Image Upload</h3>
                <p className="text-gray-600">Residents upload historical photos, documents, stories. AI auto-processes with OCR.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🤝 Community Contributions</h3>
                <p className="text-gray-600">Crowdsourced corrections, local knowledge, Elder stories, cultural heritage.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🔄 Auto-Sync</h3>
                <p className="text-gray-600">City website changes detected automatically. Always up-to-date within 24 hours.</p>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-purple-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Phase 3: Advanced Intelligence</h2>
                <p className="text-gray-500">12-24 Months</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">👤 User Profiles & Saved Chats</h3>
                <p className="text-gray-600">Access conversation history from any device. Personalized dashboards.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🔮 Predictive AI</h3>
                <p className="text-gray-600">"Your dog license expires in 30 days" - proactive reminders and suggestions.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">📊 Advanced Analytics</h3>
                <p className="text-gray-600">Business intelligence, trend forecasting, economic indicators from query patterns.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🎙️ Voice Interface</h3>
                <p className="text-gray-600">Speak your questions. Hands-free, elder-friendly, accessibility-focused.</p>
              </div>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-orange-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Phase 4: Regional Network</h2>
                <p className="text-gray-500">24+ Months</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🌐 Multi-City Expansion</h3>
                <p className="text-gray-600">Serve Kitimat, Prince Rupert, Smithers. Become Northwest BC's knowledge hub.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🔗 IoT Sensors</h3>
                <p className="text-gray-600">Real-time parking, traffic, air quality, water levels, snow depth monitoring.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🎨 Augmented Reality</h3>
                <p className="text-gray-600">Point phone at building → See history, businesses, cultural stories overlaid.</p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">🤖 AI Agents</h3>
                <p className="text-gray-600">Autonomous planning agents. "Organize my week" "Plan community event" - AI handles it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Model */}
        <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white mb-20">
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp className="w-12 h-12" />
            <h2 className="text-4xl font-bold">Sustainability & Revenue</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-2">Year 1</h3>
              <p className="text-3xl font-bold text-green-300 mb-2">$10,000 - $20,000</p>
              <p className="text-sm opacity-90">Initial investment for infrastructure scaling</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-2">Year 2</h3>
              <p className="text-3xl font-bold text-green-300 mb-2">$86,400</p>
              <p className="text-sm opacity-90">240 businesses × $30/month (20% adoption)</p>
              <p className="text-xs opacity-75 mt-2">Operating costs: ~$12,000</p>
              <p className="text-lg font-bold text-green-200 mt-2">Net: ~$74,000 profit</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-2">Year 3+</h3>
              <p className="text-3xl font-bold text-green-300 mb-2">$150,000+</p>
              <p className="text-sm opacity-90">Regional expansion + 30% business adoption</p>
              <p className="text-xs opacity-75 mt-2">Fully self-sustaining + funds innovation</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">What Premium Businesses Get:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Priority placement in search results</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Photo galleries & rich media</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Detailed service descriptions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Real-time availability updates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Customer review management</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Analytics dashboard (query trends, competitors)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Special offers & promotions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-300">✓</span>
                <span>Booking/appointment integration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="BC Hydro Live Outages"
            description="Real-time power outage tracking with restoration estimates. Historical patterns and predictive alerts."
            color="yellow"
          />
          
          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="Interactive Maps"
            description="3D terrain, flood zones, service boundaries, business clusters, trail conditions, and more."
            color="blue"
          />
          
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Community Stories"
            description="Residents share historical memories, photos, and local knowledge. Elder wisdom preserved digitally."
            color="purple"
          />
          
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="Predictive Intelligence"
            description="Seasonal reminders, personalized suggestions, event recommendations based on your interests."
            color="green"
          />
          
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Business Analytics"
            description="Premium businesses get insights: query trends, seasonal demand, competitive intelligence."
            color="orange"
          />
          
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Emergency Response"
            description="Wildfire alerts, flood warnings, evacuation routes. Multi-language crisis communication."
            color="red"
          />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Development Roadmap</h2>
          
          <div className="space-y-6">
            <TimelineItem
              phase="Current (Oct 2025)"
              items={[
                "✅ 1,128 businesses indexed with addresses & categories",
                "✅ 48 municipal bylaws with complete fee schedules",
                "✅ Cultural & educational information",
                "✅ Master ontology with historical depth",
                "✅ Conversation history & context handling"
              ]}
              status="complete"
            />
            
            <TimelineItem
              phase="Q4 2025 (3 Months)"
              items={[
                "🔄 BC Hydro RSS integration (power outages)",
                "🔄 City communications RSS (news, events, closures)",
                "🔄 Interactive map integration",
                "🔄 Terrace Standard news feed",
                "🔄 Business profile claiming system"
              ]}
              status="in-progress"
            />
            
            <TimelineItem
              phase="Q1-Q2 2026 (6 Months)"
              items={[
                "📋 Document upload & OCR processing",
                "📋 Community contribution platform",
                "📋 Historical photo archive (Heritage Park partnership)",
                "📋 User accounts & saved conversations",
                "📋 First 50 premium business profiles"
              ]}
              status="planned"
            />
            
            <TimelineItem
              phase="Q3-Q4 2026 (12 Months)"
              items={[
                "📋 Voice interface & multimodal interaction",
                "📋 Predictive AI & proactive notifications",
                "📋 Regional expansion (Kitimat, Prince Rupert pilot)",
                "📋 Mobile app (iOS & Android)",
                "📋 200+ premium business profiles"
              ]}
              status="planned"
            />
            
            <TimelineItem
              phase="2027+ (24 Months)"
              items={[
                "🔮 IoT sensor network integration",
                "🔮 Augmented reality features",
                "🔮 AI autonomous agents",
                "🔮 Full Northwest BC coverage",
                "🔮 Self-sustaining revenue model"
              ]}
              status="future"
            />
          </div>
        </div>

        {/* Impact Statement */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center">
          <Heart className="w-16 h-16 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built with ❤️ for Terrace</h2>
          <p className="text-xl md:text-2xl max-w-4xl mx-auto opacity-90 mb-8">
            Every feature, every line of code, every hour of work is dedicated to making Terrace a better place to live, work, and thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-colors"
            >
              Try Terrace AI Now
            </Link>
            <a
              href="https://github.com/EsotericShadow/terrace-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 backdrop-blur border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
            >
              View Source Code
            </a>
          </div>
        </div>

        {/* Open Source Notice */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">Open Source • Community Owned • Privacy First</p>
          <p className="text-sm">
            I acknowledge that it is an honour to live and work on the unceded traditional territories of the Kitselas and Kitsumkalum First Nations.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  const colorClasses = {
    yellow: 'from-yellow-500 to-orange-500',
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-rose-500'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
      <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TimelineItem({ phase, items, status }: { phase: string; items: string[]; status: 'complete' | 'in-progress' | 'planned' | 'future' }) {
  const statusColors = {
    complete: 'bg-green-100 text-green-800 border-green-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    planned: 'bg-purple-100 text-purple-800 border-purple-300',
    future: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const statusLabels = {
    complete: 'Complete',
    'in-progress': 'In Progress',
    planned: 'Planned',
    future: 'Future Vision'
  };

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className={`w-4 h-4 rounded-full mt-2 ${status === 'complete' ? 'bg-green-500' : status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xl font-bold text-gray-900">{phase}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-600 text-sm">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

