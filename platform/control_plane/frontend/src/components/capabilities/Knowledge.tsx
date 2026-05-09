import { useState } from 'react';
import { Link } from 'react-router-dom';

type CategoryId = 'data-sources' | 'knowledge-bases' | 'document-stores' | 'streaming';

interface Category {
  id: CategoryId;
  label: string;
  color: string;
  bg: string;
  border: string;
  hint: string;
}

const CATEGORIES: Category[] = [
  { id: 'data-sources',    label: 'Data Sources',     color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    hint: 'Structured data: S3 + databases + APIs' },
  { id: 'knowledge-bases', label: 'Knowledge Bases',  color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  hint: 'Vector-indexed retrieval over documents' },
  { id: 'document-stores', label: 'Document Stores',  color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  hint: 'Raw document repositories, pre-index' },
  { id: 'streaming',       label: 'Streaming',        color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',    hint: 'Real-time feeds and changelogs' },
];

const CATEGORY_LOOKUP = CATEGORIES.reduce((acc, c) => { acc[c.id] = c; return acc; }, {} as Record<CategoryId, Category>);

interface KnowledgeItem {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  status: 'available' | 'coming_soon';
  icon: string;
  freshness: string;
  attachedAgents: number;
  sizeOrScope: string;
  backends: string[];
}

const ITEMS: KnowledgeItem[] = [
  {
    id: 'customer-records-s3',
    name: 'Customer Records (S3)',
    description: 'Structured customer profile, KYC, and transaction snapshots delivered hourly to a governed bucket.',
    category: 'data-sources',
    status: 'available',
    icon: 'M3 7.5L7.5 3m0 0H3m4.5 0v4.5M3 12.75h16.5m-16.5 4.5h16.5M3 21h18M3 3h.008v.008H3V3zm4.5 3.75h.008v.008H7.5v-.008z',
    freshness: 'Updated hourly',
    attachedAgents: 12,
    sizeOrScope: '48M records',
    backends: ['S3', 'Glue Catalog', 'Lake Formation'],
  },
  {
    id: 'core-banking-db',
    name: 'Core Banking (RDS)',
    description: 'Read-replica connection to the system-of-record banking database with schema introspection for SQL generation.',
    category: 'data-sources',
    status: 'available',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375 7.444 2.25 12 2.25s8.25 1.847 8.25 4.125zM3.75 6.375v11.25c0 2.278 3.694 4.125 8.25 4.125s8.25-1.847 8.25-4.125V6.375M3.75 12c0 2.278 3.694 4.125 8.25 4.125s8.25-1.847 8.25-4.125',
    freshness: 'Real-time replica',
    attachedAgents: 7,
    sizeOrScope: '118 tables',
    backends: ['RDS', 'JDBC', 'Read-replica'],
  },
  {
    id: 'external-apis',
    name: 'Market & Reg APIs',
    description: 'Curated external APIs: market data, sanctions lists, regulatory feeds. Authenticated, rate-limited, and audited.',
    category: 'data-sources',
    status: 'available',
    icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
    freshness: 'Per-call latest',
    attachedAgents: 9,
    sizeOrScope: '22 endpoints',
    backends: ['OpenAPI', 'Secrets Manager', 'API Gateway'],
  },
  {
    id: 'policy-library-kb',
    name: 'Policy Library KB',
    description: 'Indexed internal policies, procedures, and regulatory guidance — the single retrieval target for compliance agents.',
    category: 'knowledge-bases',
    status: 'available',
    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    freshness: 'Re-indexed daily',
    attachedAgents: 14,
    sizeOrScope: '4.2k documents',
    backends: ['Bedrock KB', 'OpenSearch Serverless', 'Titan Embed v2'],
  },
  {
    id: 'product-docs-kb',
    name: 'Product Documentation KB',
    description: 'Customer-facing product docs and FAQs with hybrid (keyword + vector) retrieval and inline citations.',
    category: 'knowledge-bases',
    status: 'available',
    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    freshness: 'Re-indexed on change',
    attachedAgents: 6,
    sizeOrScope: '1.8k articles',
    backends: ['Bedrock KB', 'Pinecone', 'Cohere Embed v3'],
  },
  {
    id: 'credit-memo-kb',
    name: 'Credit Memo Archive',
    description: 'Historical credit memos and investment committee decisions, chunked by section for precise retrieval.',
    category: 'knowledge-bases',
    status: 'coming_soon',
    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    freshness: 'Weekly',
    attachedAgents: 0,
    sizeOrScope: '12k memos',
    backends: ['Bedrock KB', 'OpenSearch'],
  },
  {
    id: 'contracts-store',
    name: 'Contracts & Agreements',
    description: 'Raw PDF store for counterparty agreements, feeding downstream KBs or ad-hoc extraction tools.',
    category: 'document-stores',
    status: 'available',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    freshness: 'Upload on demand',
    attachedAgents: 4,
    sizeOrScope: '38k files · 1.2 TB',
    backends: ['S3', 'Textract', 'KMS'],
  },
  {
    id: 'media-archive',
    name: 'Adverse Media Archive',
    description: 'Collected news, press releases, and third-party alerts — raw, with text extraction and sentiment tagging.',
    category: 'document-stores',
    status: 'coming_soon',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    freshness: 'Daily ingest',
    attachedAgents: 0,
    sizeOrScope: '∼2.8M articles',
    backends: ['S3', 'Comprehend'],
  },
  {
    id: 'transaction-stream',
    name: 'Transaction Stream',
    description: 'Kinesis-backed real-time feed of transactions for fraud detection and market surveillance agents.',
    category: 'streaming',
    status: 'available',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    freshness: 'Sub-second',
    attachedAgents: 5,
    sizeOrScope: '∼12M events/day',
    backends: ['Kinesis', 'EventBridge'],
  },
  {
    id: 'audit-changelog',
    name: 'Audit Changelog',
    description: 'Append-only log of policy, control, and approval changes — the source feed for governance activity agents.',
    category: 'streaming',
    status: 'coming_soon',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    freshness: 'Real-time',
    attachedAgents: 0,
    sizeOrScope: 'Continuous',
    backends: ['EventBridge', 'CloudTrail'],
  },
];

export default function Knowledge() {
  const [filter, setFilter] = useState<'all' | CategoryId>('all');
  const [search, setSearch] = useState('');

  const filtered = ITEMS.filter(item => {
    const matchesFilter = filter === 'all' || item.category === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || item.name.toLowerCase().includes(q)
      || item.description.toLowerCase().includes(q)
      || item.backends.some(b => b.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 70% at 20% 50%, rgba(224,231,255,0.8) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 40%, rgba(221,214,254,0.5) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 50% 80%, rgba(204,251,241,0.4) 0%, transparent 50%)',
        animation: 'gradientDrift 20s ease-in-out infinite',
      }} />
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-in">
          <Link to="/capabilities" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">← Back to Capabilities</Link>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mt-3">Knowledge</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Everything agents read from — raw data sources for structured lookup, indexed knowledge bases for retrieval-augmented answers, and streaming feeds for real-time reasoning. All governed, lineaged, and access-controlled in one place.
          </p>
        </div>

        {/* How it works */}
        <div className="card bg-indigo-50/50 border-indigo-200/60 mb-6 animate-fade-in stagger-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-indigo-900 font-semibold">How Knowledge works</p>
              <p className="text-sm text-indigo-700/80 mt-1">
                Register a source once, govern it everywhere. <strong>Data sources</strong> (S3, RDS, APIs) give agents structured lookups. <strong>Knowledge bases</strong> index documents into vector stores for grounded retrieval. Attach either to an agent at deploy time — retrieval happens automatically during reasoning, with lineage and access captured for audit.
              </p>
            </div>
          </div>
        </div>

        {/* Register CTA */}
        <div className="mb-6 animate-fade-in stagger-1">
          <div className="group relative bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
            <div className="relative p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md ring-1 ring-slate-900/5 group-hover:scale-105 group-hover:shadow-lg transition-all flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Register Knowledge</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-500">Connect a new data source, spin up a Bedrock Knowledge Base, or register a streaming feed — with IAM scope, lineage, and access audit baked in from day one.</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['S3 bucket', 'JDBC database', 'OpenAPI endpoint', 'Bedrock KB', 'Kinesis stream'].map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200">{t}</span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 animate-fade-in stagger-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search sources, KBs, or backends..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm outline-none transition-all duration-150 focus:border-indigo-400 pr-4"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8 animate-fade-in stagger-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            All ({ITEMS.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = ITEMS.filter(i => i.category === cat.id).length;
            if (!count) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(filter === cat.id ? 'all' : cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filter === cat.id
                    ? `${cat.bg} ${cat.color} border ${cat.border}`
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-3">
          {filtered.map(item => {
            const cat = CATEGORY_LOOKUP[item.category];
            return (
              <div key={item.id} className="group bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/70 p-5 hover:shadow-md hover:border-indigo-300/60 transition-all flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center flex-shrink-0`}>
                    <svg className={`w-5 h-5 ${cat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900 leading-tight">{item.name}</h3>
                      {item.status === 'coming_soon' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">Soon</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${cat.color} mt-0.5 inline-block`}>{cat.label}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-3">{item.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400">Agents</div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{item.attachedAgents}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400">Scope</div>
                    <div className="text-[11px] font-semibold text-slate-900 mt-0.5 truncate" title={item.sizeOrScope}>{item.sizeOrScope}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400">Refresh</div>
                    <div className="text-[11px] font-semibold text-slate-900 mt-0.5 truncate" title={item.freshness}>{item.freshness}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-auto">
                  {item.backends.map(b => (
                    <span key={b} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200">{b}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">No sources match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
