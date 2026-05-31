import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { KnowledgeIcon } from '../components/Icons'
import { knowledgeApi, unwrap, unwrapList } from '../services/api'

const DOC_TYPES = ['menu', 'allergy', 'policy', 'faq', 'general']
const DOC_TYPE_LABELS = {
  menu: 'Menu',
  allergy: 'Allergy',
  policy: 'Policy',
  faq: 'FAQ',
  general: 'General',
}

/* ── Doc type icons (inline SVG) ── */
const DOC_TYPE_SVG = {
  menu: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 2h1a2 2 0 0 1 2 2v15a2 2 0 0 1-4 0V4a2 2 0 0 1 1-2z"/>
      <path d="M9 2h8a2 2 0 0 1 2 2v4H9V2z"/>
      <path d="M9 10h10v10a2 2 0 0 1-2 2H9V10z"/>
    </svg>
  ),
  allergy: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  policy: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  faq: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  general: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
}

/* ── Alert banner ── */
function AlertBanner({ message, onNavigateMenu }) {
  if (!message.text) return null
  const colorMap = {
    success: { bg: 'rgba(34,197,94,0.06)',  color: '#16a34a', border: 'rgba(34,197,94,0.15)' },
    error:   { bg: 'rgba(239,68,68,0.06)',  color: '#dc2626', border: 'rgba(239,68,68,0.15)' },
    warning: { bg: 'rgba(245,158,11,0.07)', color: '#b45309', border: 'rgba(245,158,11,0.18)' },
    info:    { bg: 'rgba(170,48,26,0.06)',  color: '#aa301a', border: 'rgba(170,48,26,0.15)' },
  }
  const c = colorMap[message.type] || colorMap.info
  return (
    <div
      className="mb-6 rounded-2xl px-5 py-3.5 text-sm font-medium flex items-center justify-between gap-4"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, animation: 'fadeInUp 0.25s ease' }}
    >
      <span>{message.text}</span>
      {message.showMenuLink && (
        <button
          onClick={onNavigateMenu}
          className="flex-shrink-0 font-bold whitespace-nowrap"
          style={{ color: c.color, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
        >
          View in Menu →
        </button>
      )}
    </div>
  )
}

export default function DocumentUpload() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [docType, setDocType] = useState('menu')
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [message, setMessage] = useState({ text: '', type: 'info' })

  const loadDocuments = async () => {
    const res = await knowledgeApi.listDocuments()
    setDocuments(unwrapList(res))
  }

  useEffect(() => { loadDocuments() }, [])

  const onDrop = useCallback((accepted) => {
    if (accepted.length === 0) return
    const file = accepted[0]
    setUploadFile(file)
    const name = file.name.toLowerCase()
    if (name.includes('menu')) setDocType('menu')
    else if (name.includes('allerg')) setDocType('allergy')
    else if (name.includes('policy') || name.includes('faq')) setDocType('policy')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('doc_type', docType)
      const res = await knowledgeApi.upload(formData)
      setUploadFile(null)
      const extracted = res.data?.menu_items_extracted
      if (extracted != null && extracted > 0) {
        setMessage({ text: `Document uploaded! ${extracted} menu items added to your menu.`, type: 'success', showMenuLink: true })
      } else if (extracted === 0) {
        setMessage({ text: 'Document uploaded. No menu items could be parsed — add them manually in Menu.', type: 'warning', showMenuLink: false })
      } else {
        setMessage({ text: 'Document uploaded and chunked successfully!', type: 'info', showMenuLink: false })
      }
      await loadDocuments()
    } catch (err) {
      const status = err.response?.status
      const rawDetail = err.response?.data?.detail
      const detail = Array.isArray(rawDetail)
        ? rawDetail.map(e => e.msg || JSON.stringify(e)).join('; ')
        : rawDetail || err.message || 'No response from server — is the backend running?'
      const isConflict = status === 409
      setMessage({ text: isConflict ? detail : `Upload failed: ${detail}`, type: isConflict ? 'warning' : 'error' })
    } finally {
      setUploading(false)
      setTimeout(() => setMessage({ text: '', type: 'info' }), 6000)
    }
  }

  const handleSyncMenu = async () => {
    setSyncing(true)
    try {
      const res = await knowledgeApi.syncMenu()
      const data = unwrap(res) || {}
      const inserted = data.inserted ?? 0
      if (inserted > 0) {
        setMessage({ text: `Menu re-extracted! ${inserted} items added to your menu.`, type: 'success', showMenuLink: true })
      } else {
        setMessage({ text: data.message || 'No new items found. All items may already be in the menu.', type: 'warning', showMenuLink: false })
      }
    } catch (err) {
      setMessage({ text: `Re-extraction failed: ${err.response?.data?.detail || 'Unknown error'}`, type: 'error' })
    } finally {
      setSyncing(false)
      setTimeout(() => setMessage({ text: '', type: 'info' }), 6000)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this document and all its chunks?')) return
    await knowledgeApi.deleteDocument(id)
    await loadDocuments()
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const res = await knowledgeApi.search(searchQuery)
    setSearchResults(res.data)
  }

  return (
    <Layout>
      <div className="app-page">

        <PageHeader
          icon={KnowledgeIcon}
          title="Knowledge Base"
          subtitle="Upload menus, allergy info, and policies. The AI uses these to answer customer questions accurately."
          accent="var(--accent-blue)"
          accentBg="rgba(47,128,237,0.10)"
        />

        <AlertBanner message={message} onNavigateMenu={() => navigate('/menu')} />

        {/* ── Upload Card ── */}
        <div
          className="rounded-2xl mb-6"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            animation: 'fadeInUp 0.4s ease 0.05s both',
          }}
        >
          <h2
            className="font-bold mb-4"
            style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.01em' }}
          >
            Upload Document
          </h2>

          {/* Doc type pills */}
          <div className="mb-4">
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--text-3)', letterSpacing: '0.04em' }}
            >
              DOCUMENT TYPE
            </label>
            <div className="tab-row">
              {DOC_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                  style={{
                    background: docType === type ? '#aa301a' : 'var(--surface-2)',
                    color: docType === type ? '#fff' : 'var(--text-2)',
                    border: docType === type ? '1.5px solid transparent' : '1.5px solid var(--border)',
                    boxShadow: docType === type ? '0 2px 8px rgba(170,48,26,0.25)' : 'none',
                  }}
                >
                  {DOC_TYPE_SVG[type]}
                  {DOC_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? '#aa301a' : 'var(--border)'}`,
              borderRadius: 14,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(170,48,26,0.04)' : 'var(--surface-2)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (!isDragActive) e.currentTarget.style.borderColor = '#aa301a' }}
            onMouseLeave={e => { if (!isDragActive) e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <input {...getInputProps()} />
            {uploadFile ? (
              <div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
                  background: 'rgba(170,48,26,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aa301a" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{uploadFile.name}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  {(uploadFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
                  background: 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>
                  {isDragActive ? 'Drop it here' : 'Drag & drop or click to upload'}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>PDF, DOCX, TXT · Max 10 MB</div>
              </div>
            )}
          </div>

          {uploadFile && (
            <div className="mt-4 flex gap-2">
              <button onClick={handleUpload} disabled={uploading} className="btn-primary">
                {uploading ? 'Processing…' : `Upload as ${DOC_TYPE_LABELS[docType]}`}
              </button>
              <button onClick={() => setUploadFile(null)} className="btn-secondary">Cancel</button>
            </div>
          )}
        </div>

        {/* ── Documents list ── */}
        <div
          className="rounded-2xl mb-6"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            animation: 'fadeInUp 0.4s ease 0.1s both',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-bold"
              style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.01em' }}
            >
              Uploaded Documents
              <span
                className="ml-2 font-semibold"
                style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)' }}
              >
                {documents.length}
              </span>
            </h2>
            {documents.some(d => d.doc_type === 'menu') && (
              <button
                onClick={handleSyncMenu}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: syncing ? 'var(--surface-3)' : 'rgba(170,48,26,0.10)',
                  color: syncing ? 'var(--text-3)' : '#aa301a',
                  border: '1px solid rgba(170,48,26,0.18)',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!syncing) e.currentTarget.style.background = 'rgba(170,48,26,0.18)' }}
                onMouseLeave={e => { if (!syncing) e.currentTarget.style.background = 'rgba(170,48,26,0.10)' }}
                title="Re-run menu item extraction from all uploaded menu documents"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                {syncing ? 'Re-extracting…' : 'Re-extract Menu Items'}
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div
              className="text-center py-10 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, margin: '0 auto 10px',
                background: 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)', marginBottom: 4 }}>No documents yet</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Upload your menu to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: 'rgba(170,48,26,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#aa301a',
                    }}>
                      {DOC_TYPE_SVG[doc.doc_type] || DOC_TYPE_SVG.general}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                        {doc.filename}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {DOC_TYPE_LABELS[doc.doc_type]} · {doc.chunk_count} chunks · {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs font-semibold flex-shrink-0 ml-4 px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#dc2626', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Test search ── */}
        <div
          className="rounded-2xl"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            animation: 'fadeInUp 0.4s ease 0.15s both',
          }}
        >
          <h2
            className="font-bold mb-1"
            style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.01em' }}
          >
            Test Knowledge Search
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
            Simulate how the AI looks up information during a call.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              style={{ fontSize: 13 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. 'is the burger gluten free?' or 'delivery policy'"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-2)' }}>
                      {DOC_TYPE_LABELS[result.doc_type] || result.doc_type}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(170,48,26,0.08)', color: '#aa301a' }}
                    >
                      {(result.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>{result.chunk_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
