import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ── Brand colours ── */
const C = {
  indigo:      [9,   76,  178],
  indigoDark:  [7,   65,  163],
  violet:      [9,   76,  178],
  dark:        [10,  22,  40],
  white:       [255, 255, 255],
  slate100:    [241, 245, 249],
  slate200:    [226, 232, 240],
  slate500:    [100, 116, 139],
  slate700:    [51,  65,  85],
  slate900:    [15,  23,  42],
  green:       [16,  185, 129],
  red:         [239, 68,  68],
  yellow:      [245, 158, 11],
  amber:       [251, 191, 36],
}

/* ── Helpers ── */
const hex = ([r, g, b]) => ({ r, g, b })

function setFill(doc, color)   { doc.setFillColor(...color) }
function setFont(doc, color)   { doc.setTextColor(...color) }
function setDraw(doc, color)   { doc.setDrawColor(...color) }

function fmt(n, prefix = '$') {
  return prefix + parseFloat(n || 0).toFixed(2)
}

function asText(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function periodLabel(period) {
  return { week: 'Last 7 Days', month: 'Last 30 Days', year: 'Last 12 Months' }[period] || period
}

function statusColor(status) {
  switch(status) {
    case 'picked_up':  return [16, 185, 129]
    case 'preparing':  return [249, 115, 22]
    case 'confirmed':  return [96, 165, 250]
    case 'ready':      return [52, 211, 153]
    case 'cancelled':  return [239, 68, 68]
    default:           return [245, 158, 11]  // new
  }
}

function payBadgeColor(status) {
  return status === 'paid' ? [16, 185, 129] : [100, 116, 139]
}

/* ── Main export function ── */
export async function generateReportPDF(data, options = {}) {
  const report = data || {}
  const sections = {
    summary: true,
    calls: true,
    callVolume: true,
    revenue: true,
    orders: true,
    payments: true,
    ...(options.sections || {}),
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW  = doc.internal.pageSize.getWidth()   // 210
  const PH  = doc.internal.pageSize.getHeight()  // 297
  const M   = 14   // margin

  let y = 0  // current Y cursor

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     PAGE 1 — COVER HEADER
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  // Dark header band
  setFill(doc, C.dark)
  doc.rect(0, 0, PW, 52, 'F')

  // Indigo accent stripe
  setFill(doc, C.indigo)
  doc.rect(0, 52, PW, 3, 'F')

  // Restaurant name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setFont(doc, C.white)
  doc.text(report.restaurant_name?.toUpperCase() || 'RESTAURANT', M, 22)

  // Report subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setFont(doc, [165, 180, 252])  // indigo-300
  doc.text('AI AGENT  •  BUSINESS REPORT', M, 31)

  // Period pill (right side)
  const pillLabel = periodLabel(report.period)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  setFill(doc, C.indigo)
  doc.roundedRect(PW - M - 44, 14, 44, 10, 2, 2, 'F')
  setFont(doc, C.white)
  doc.text(pillLabel, PW - M - 22, 20.5, { align: 'center' })

  // Date range line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setFont(doc, [148, 163, 184])  // slate-400
  const since = report.since
    ? new Date(report.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Start date unavailable'
  const until = report.until
    ? new Date(report.until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today'
  doc.text(`${since}  to  ${until}`, M, 41)

  // Generated timestamp
  const genAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  doc.text(`Generated: ${genAt}`, PW - M, 41, { align: 'right' })

  y = 65

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SECTION 1 — ORDER SUMMARY METRICS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  const s = report.summary || {}
  const c = report.calls || {}
  const orders = Array.isArray(report.orders) ? report.orders : []

  if (sections.summary) {
    y = ensureSpace(doc, y, 62, PH)
    sectionHeader(doc, 'Order Summary', y, M, PW)
    y += 8

    const metrics = [
      { label: 'Total Orders',     value: asText(s.total_orders, '0'),       color: C.indigo },
      { label: 'Completed',        value: asText(s.completed_orders, '0'),   color: C.green  },
      { label: 'Cancelled',        value: asText(s.cancelled_orders, '0'),   color: C.red    },
      { label: 'Total Revenue',    value: fmt(s.revenue),                    color: C.indigo },
      { label: 'Avg Order Value',  value: fmt(s.avg_order_value),            color: C.violet },
      { label: 'Completion Rate',  value: s.total_orders
          ? Math.round((s.completed_orders || 0) / s.total_orders * 100) + '%'
          : '—',                                                             color: C.green  },
    ]

    y += drawMetricGrid(doc, metrics, y, M, PW, 3) + 10
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SECTION 2 — CALL ANALYTICS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  if (sections.calls) {
    y = ensureSpace(doc, y, 62, PH)
    sectionHeader(doc, 'AI Call Analytics', y, M, PW)
    y += 8

    const callMetrics = [
      { label: 'Total Calls',       value: asText(c.total, '0'),             color: C.indigo },
      { label: 'Completed Calls',   value: asText(c.completed, '0'),         color: C.green  },
      { label: 'Abandoned',         value: asText(c.abandoned, '0'),         color: C.red    },
      { label: 'Completion Rate',   value: `${c.completion_rate || 0}%`,     color: (c.completion_rate || 0) >= 80 ? C.green : C.yellow },
      { label: 'Avg Call Duration', value: formatDuration(c.avg_duration_seconds), color: C.violet },
      { label: 'Orders from Calls', value: asText(s.total_orders, '0'),      color: C.indigo },
    ]

    y += drawMetricGrid(doc, callMetrics, y, M, PW, 3) + 10
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SECTION 3 — CALLS BY DATE TABLE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  if (sections.callVolume) {
    y = ensureSpace(doc, y, 55, PH)
    sectionHeader(doc, 'Daily Call Volume', y, M, PW)
    y += 5

    const callRows = (report.calls_by_date || []).map(d => [
      formatDate(d.date),
      d.completed || 0,
      d.abandoned  || 0,
      (d.completed || 0) + (d.abandoned || 0),
      d.completed && ((d.completed || 0) + (d.abandoned || 0))
        ? Math.round((d.completed / ((d.completed || 0) + (d.abandoned || 0))) * 100) + '%'
        : '—',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Completed', 'Abandoned', 'Total', 'Rate']],
      body: callRows.length ? callRows : [['No call data in this period', '—', '—', '—', '—']],
      margin: { left: M, right: M },
      styles: {
        font: 'helvetica', fontSize: 8.5,
        cellPadding: 3.5, valign: 'middle',
        textColor: C.slate700,
      },
      headStyles: {
        fillColor: C.indigo,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: { fillColor: C.slate100 },
      columnStyles: {
        0: { cellWidth: 52 },
        1: { halign: 'center', textColor: C.green },
        2: { halign: 'center', textColor: C.red   },
        3: { halign: 'center', fontStyle: 'bold'  },
        4: { halign: 'center' },
      },
      didDrawPage: () => { drawPageFooter(doc, PW, PH, report.restaurant_name) },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SECTION 4 — REVENUE BY DATE TABLE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  if (sections.revenue) {
    y = ensureSpace(doc, y, 60, PH)

    sectionHeader(doc, 'Daily Revenue', y, M, PW)
    y += 5

    const revRows = (report.revenue_by_date || []).map(d => [
      formatDate(d.date),
      fmt(d.revenue),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Revenue']],
      body: revRows.length ? revRows : [['No revenue data in this period', '—']],
      margin: { left: M, right: M },
      styles: {
        font: 'helvetica', fontSize: 8.5,
        cellPadding: 3.5, valign: 'middle',
        textColor: C.slate700,
      },
      headStyles: { fillColor: C.indigo, textColor: C.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: C.slate100 },
      columnStyles: {
        0: { cellWidth: 86 },
        1: { halign: 'right', fontStyle: 'bold', textColor: C.indigo },
      },
      didDrawPage: () => { drawPageFooter(doc, PW, PH, report.restaurant_name) },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  if (sections.payments) {
    y = ensureSpace(doc, y, 70, PH)

    sectionHeader(doc, 'Payment Status Breakdown', y, M, PW)
    y += 5

    const paymentCounts = orders.reduce((acc, order) => {
      const status = order.payment_status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    const paymentRows = Object.entries(paymentCounts).map(([status, count]) => [
      status.replace('_', ' '),
      count,
      orders.length ? `${Math.round((count / orders.length) * 100)}%` : '—',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Payment Status', 'Orders', 'Share']],
      body: paymentRows.length ? paymentRows : [['No payment data in this period', '—', '—']],
      margin: { left: M, right: M },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3.5, valign: 'middle', textColor: C.slate700 },
      headStyles: { fillColor: C.indigo, textColor: C.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: C.slate100 },
      columnStyles: {
        0: { cellWidth: 90, textColor: C.slate900, fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
      },
      didDrawPage: () => { drawPageFooter(doc, PW, PH, report.restaurant_name) },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SECTION 5 — FULL ORDERS TABLE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  if (sections.orders) {
    // Always start orders on a new page for readability
    doc.addPage()
    y = 20

    sectionHeader(doc, `All Orders  (${orders.length})`, y, M, PW)
    y += 5

    const orderRows = orders.map((o, i) => [
      i + 1,
      asText(o.created_at),
      asText(o.customer_name),
      asText(o.customer_phone, ''),
      asText(o.items),
      fmt(o.total),
      asText(o.status).replace('_', ' '),
      asText(o.payment_status),
    ])

    autoTable(doc, {
      startY: y,
      head: [['#', 'Date & Time', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Payment']],
      body: orderRows.length ? orderRows : [['—', 'No orders in this period', '—', '—', '—', '—', '—', '—']],
      margin: { left: M, right: M },
      styles: {
        font: 'helvetica', fontSize: 7.4,
        cellPadding: 2.8, valign: 'middle',
        textColor: C.slate700, overflow: 'linebreak',
      },
      headStyles: {
        fillColor: C.dark,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 7.8,
      },
      alternateRowStyles: { fillColor: C.slate100 },
      columnStyles: {
        0: { cellWidth: 7,  halign: 'center', textColor: C.slate500 },
        1: { cellWidth: 28, fontSize: 7 },
        2: { cellWidth: 23, fontStyle: 'bold' },
        3: { cellWidth: 21, fontSize: 7, textColor: C.slate500 },
        4: { cellWidth: 49 },
        5: { cellWidth: 17, halign: 'right', fontStyle: 'bold', textColor: C.indigoDark },
        6: { cellWidth: 19, halign: 'center' },
        7: { cellWidth: 18, halign: 'center' },
      },
      didParseCell: (hookData) => {
        // Colour-code status column
        if (hookData.column.index === 6 && hookData.section === 'body') {
          const raw = orders?.[hookData.row.index]?.status
          if (raw) {
            hookData.cell.styles.textColor = statusColor(raw)
            hookData.cell.styles.fontStyle = 'bold'
          }
        }
        // Colour-code payment column
        if (hookData.column.index === 7 && hookData.section === 'body') {
          const raw = orders?.[hookData.row.index]?.payment_status
          if (raw) hookData.cell.styles.textColor = payBadgeColor(raw)
        }
      },
      didDrawPage: () => { drawPageFooter(doc, PW, PH, report.restaurant_name) },
    })
  }

  // Final page footer
  drawPageFooter(doc, PW, PH, report.restaurant_name)

  /* ── Save ── */
  const fname = `${(report.restaurant_name || 'report').replace(/\s+/g, '_')}_${report.period || 'custom'}_report_${report.until || new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fname)
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPER COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function sectionHeader(doc, title, y, M, PW) {
  // Accent line + label
  setFill(doc, C.indigo)
  doc.rect(M, y, 3, 5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setFont(doc, C.slate900)
  doc.text(title, M + 6, y + 4)

  setDraw(doc, C.slate200)
  doc.setLineWidth(0.3)
  doc.line(M, y + 7, PW - M, y + 7)
}

function ensureSpace(doc, y, needed, PH) {
  if (y + needed > PH - 16) {
    doc.addPage()
    return 20
  }
  return y
}

function drawMetricGrid(doc, metrics, y, M, PW, cols = 3) {
  const totalW = PW - M * 2
  const gap = 4
  const cellW  = (totalW - gap * (cols - 1)) / cols
  const cellH  = 22
  const rows = Math.ceil(metrics.length / cols)

  metrics.forEach((m, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x   = M + col * (cellW + gap)
    const cy  = y + row * cellH

    // Card background
    setFill(doc, C.slate100)
    doc.roundedRect(x, cy, cellW, cellH - 2, 2, 2, 'F')

    // Accent top border
    setFill(doc, m.color)
    doc.rect(x, cy, cellW, 1.5, 'F')

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setFont(doc, m.color)
    doc.text(asText(m.value), x + (cellW / 2), cy + 10, { align: 'center' })

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setFont(doc, C.slate500)
    doc.text(m.label, x + (cellW / 2), cy + 16, { align: 'center' })
  })

  return rows * cellH
}

function drawPageFooter(doc, PW, PH, restaurantName) {
  const totalPages = doc.internal.getNumberOfPages()
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber

  setFill(doc, C.slate100)
  doc.rect(0, PH - 10, PW, 10, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setFont(doc, C.slate500)
  doc.text(`${restaurantName} — Confidential Business Report`, 14, PH - 3.5)
  doc.text(`Page ${currentPage} of ${totalPages}`, PW - 14, PH - 3.5, { align: 'right' })
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
