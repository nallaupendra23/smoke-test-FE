import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { InventoryIcon } from '../components/Icons'
import { inventoryApi } from '../services/inventoryApi'
import LowStockAlert from '../components/inventory/LowStockAlert'
import InventoryTable from '../components/inventory/InventoryTable'
import UploadInventory from '../components/inventory/UploadInventory'
import MappingUI from '../components/inventory/MappingUI'
import WasteEntry from '../components/inventory/WasteEntry'
import WasteCard from '../components/inventory/WasteCard'
import ProfitCard from '../components/inventory/ProfitCard'
import RecommendationsTable from '../components/inventory/RecommendationsTable'
import InvoiceUpload from '../components/inventory/InvoiceUpload'

const TABS = [
  { id: 'stock',   label: 'Stock' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'profit',  label: 'Profit' },
  { id: 'waste',   label: 'Waste' },
  { id: 'reorder', label: 'Reorder' },
  { id: 'invoice', label: 'Invoice Scanner' },
]

export default function Inventory() {
  const [tab, setTab] = useState('stock')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  const loadItems = useCallback(() => {
    setLoading(true)
    inventoryApi.list()
      .then((r) => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const lowStockItems = items.filter((i) => i.low_stock)

  return (
    <Layout>
      <div className="app-page">

        <PageHeader
          icon={InventoryIcon}
          title="Inventory"
          subtitle="Track stock, map ingredients, and monitor waste and profit"
          accent="var(--accent-mint)"
          accentBg="rgba(39,174,96,0.10)"
        >
          {tab === 'stock' && (
            <button
              onClick={() => setShowUpload((v) => !v)}
              className="btn-primary"
              style={showUpload ? { background: 'var(--surface-2)', color: 'var(--text-2)', boxShadow: 'none' } : {}}
            >
              {showUpload ? 'Hide Upload' : '+ Upload / Add Items'}
            </button>
          )}
        </PageHeader>

        {/* Tab bar */}
        <div
          className="tab-row mb-5 p-1 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', width: 'fit-content' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="tab-btn"
              style={{
                fontSize: 13,
                padding: '6px 16px',
                ...(tab === t.id ? { background: 'var(--primary)', color: '#fff' } : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>

          {/* ── Stock ── */}
          {tab === 'stock' && (
            <div>
              <LowStockAlert items={lowStockItems} />

              {showUpload && (
                <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
                    Add / Update Inventory
                  </div>
                  <UploadInventory onSuccess={() => { loadItems(); setShowUpload(false) }} />
                </div>
              )}

              {loading ? (
                <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '20px 0' }}>
                  Loading inventory...
                </div>
              ) : (
                <InventoryTable items={items} onRefresh={loadItems} />
              )}
            </div>
          )}

          {/* ── Mapping ── */}
          {tab === 'mapping' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                Link menu items to inventory ingredients so orders auto-deduct stock.
              </div>
              <MappingUI inventoryItems={items} />
            </div>
          )}

          {/* ── Profit ── */}
          {tab === 'profit' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                Revenue, ingredient costs, and profit per day.{' '}
                {items.length === 0 && 'Add inventory items and ingredient mappings to see cost data.'}
              </div>
              <ProfitCard />
            </div>
          )}

          {/* ── Waste ── */}
          {tab === 'waste' && (
            <div className="flex gap-10">
              <div style={{ flex: '0 0 380px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
                  Log Waste
                </div>
                <WasteEntry inventoryItems={items} onSuccess={loadItems} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16 }}>
                  Waste Analytics (last 30 days)
                </div>
                <WasteCard />
              </div>
            </div>
          )}

          {/* ── Reorder ── */}
          {tab === 'reorder' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                Weekly reorder suggestions based on the last 7 days of usage.
              </div>
              <RecommendationsTable />
            </div>
          )}

          {/* ── Invoice Scanner ── */}
          {tab === 'invoice' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                Upload a supplier invoice — AI will extract item names, quantities, and costs and add them to your inventory.
              </div>
              <InvoiceUpload inventoryItems={items} onSuccess={loadItems} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
