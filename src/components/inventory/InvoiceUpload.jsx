import { useRef, useState } from 'react'
import { inventoryApi } from '../../services/inventoryApi'

const VALID_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv', 'text/plain',
]
const VALID_EXT = /\.(pdf|jpg|jpeg|png|webp|gif|docx|csv|txt)$/i

function formatCurrency(n) {
  return n == null ? '—' : `$${Number(n).toFixed(2)}`
}

export default function InvoiceUpload({ inventoryItems = [], onSuccess }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)       // extracted invoice
  const [editedItems, setEditedItems] = useState([]) // editable line items
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [autoMapping, setAutoMapping] = useState(false)
  const [autoMapResult, setAutoMapResult] = useState(null)

  function reset() {
    setResult(null)
    setEditedItems([])
    setError('')
    setSaved(false)
    setAutoMapping(false)
    setAutoMapResult(null)
  }

  function validateFile(file) {
    if (!file) return 'No file selected.'
    if (!VALID_TYPES.includes(file.type) && !VALID_EXT.test(file.name)) {
      return 'Unsupported file type. Please upload a PDF, image, DOCX, CSV, or TXT.'
    }
    if (file.size > 10 * 1024 * 1024) return 'File too large (max 10 MB).'
    return null
  }

  async function processFile(file) {
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError('')
    setScanning(true)
    reset()
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await inventoryApi.extractInvoice(fd)
      const data = res.data
      setResult(data)
      setEditedItems((data.items || []).map((item, i) => ({ ...item, _key: i })))
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to scan invoice. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  function onFileChange(e) {
    if (e.target.files?.[0]) processFile(e.target.files[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0])
  }

  function updateItem(key, field, value) {
    setEditedItems((prev) =>
      prev.map((it) => it._key === key ? { ...it, [field]: value } : it)
    )
  }

  function removeItem(key) {
    setEditedItems((prev) => prev.filter((it) => it._key !== key))
  }

  async function saveToInventory() {
    const items = editedItems.map(({ name, quantity, unit, cost_per_unit }) => ({
      name: String(name || '').trim(),
      quantity: parseFloat(quantity) || 0,
      unit: String(unit || 'unit').trim(),
      cost_per_unit: parseFloat(cost_per_unit) || 0,
    })).filter((it) => it.name)

    if (!items.length) { setError('No items to save.'); return }

    setSaving(true)
    setError('')
    try {
      await inventoryApi.upload(items)
      setSaved(true)
      if (onSuccess) onSuccess()
      // Auto-map the newly added inventory items to menu items using AI
      setAutoMapping(true)
      try {
        const mapRes = await inventoryApi.autoMap()
        setAutoMapResult(mapRes.data)
      } catch {
        setAutoMapResult({ mapped_dishes: 0, mappings_created: 0, message: 'Auto-mapping skipped.' })
      } finally {
        setAutoMapping(false)
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save items.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Drop zone */}
      {!result && !scanning && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 14,
            background: dragging ? 'var(--primary-light)' : 'var(--surface-2)',
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            Drop your supplier invoice here
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            PDF, image (JPG/PNG/WEBP), DOCX, CSV, TXT · max 10 MB
          </div>
          <div style={{
            marginTop: 16,
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: 8,
            background: 'var(--primary)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
          }}>
            Choose File
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.docx,.csv,.txt"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 14,
          background: 'var(--surface-2)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            Scanning invoice...
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            AI is reading your invoice and extracting line items
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 12,
          padding: '10px 16px',
          borderRadius: 8,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && !scanning && (
        <div>
          {/* Invoice metadata */}
          <div style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20,
            padding: '14px 18px',
            background: 'var(--primary-light)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            {[
              { label: 'Supplier', value: result.supplier_name || '—' },
              { label: 'Invoice Date', value: result.invoice_date || '—' },
              { label: 'Invoice #', value: result.invoice_number || '—' },
              { label: 'Total', value: formatCurrency(result.total_amount) },
            ].map(({ label, value }) => (
              <div key={label} style={{ minWidth: 120 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Editable items table */}
          {saved ? (
            <div style={{
              borderRadius: 12,
              border: '1px solid #bbf7d0',
              overflow: 'hidden',
            }}>
              {/* Saved header */}
              <div style={{
                padding: '18px 20px',
                background: '#f0fdf4',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                    {editedItems.length} item{editedItems.length !== 1 ? 's' : ''} saved to inventory
                  </div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                    Stock levels updated successfully
                  </div>
                </div>
              </div>

              {/* Auto-mapping result */}
              <div style={{
                padding: '14px 20px',
                background: '#fff',
                borderTop: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {autoMapping ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                      AI is mapping ingredients to your menu items…
                    </div>
                  </>
                ) : autoMapResult ? (
                  <>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: autoMapResult.mapped_dishes > 0 ? 'rgba(99,102,241,0.10)' : 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={autoMapResult.mapped_dishes > 0 ? '#6366f1' : 'var(--text-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </div>
                    <div>
                      {autoMapResult.mapped_dishes > 0 ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>
                            AI mapped {autoMapResult.mapped_dishes} dishes — {autoMapResult.mappings_created} ingredient connections created
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            Go to the Profit tab to see preparation costs
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {autoMapResult.message || 'No new mappings found — all dishes may already be mapped.'}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div style={{ padding: '12px 20px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', textAlign: 'center' }}>
                <button
                  onClick={reset}
                  style={{ padding: '6px 20px', borderRadius: 8, fontSize: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-2)', fontWeight: 600 }}
                >
                  Scan Another Invoice
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10 }}>
                Extracted Items
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 8 }}>
                  Edit before saving · {editedItems.length} item{editedItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      {['Item Name', 'Qty', 'Unit', 'Cost/Unit', ''].map((h) => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editedItems.map((item) => (
                      <tr key={item._key} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 10px' }}>
                          <input
                            value={item.name || ''}
                            onChange={(e) => updateItem(item._key, 'name', e.target.value)}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: '7px 10px', width: 90 }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity ?? ''}
                            onChange={(e) => updateItem(item._key, 'quantity', e.target.value)}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: '7px 10px', width: 90 }}>
                          <input
                            value={item.unit || ''}
                            onChange={(e) => updateItem(item._key, 'unit', e.target.value)}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: '7px 10px', width: 110 }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cost_per_unit ?? ''}
                            onChange={(e) => updateItem(item._key, 'cost_per_unit', e.target.value)}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: '7px 10px', width: 36, textAlign: 'center' }}>
                          <button
                            onClick={() => removeItem(item._key)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
                            title="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={saveToInventory}
                  disabled={saving || editedItems.length === 0}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : `Save ${editedItems.length} Item${editedItems.length !== 1 ? 's' : ''} to Inventory`}
                </button>
                <button
                  onClick={reset}
                  style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  fontSize: 13,
  color: 'var(--text-1)',
  background: 'var(--surface-1)',
  outline: 'none',
}
