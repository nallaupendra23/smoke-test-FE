import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OrderCard from '../OrderCard'

vi.mock('../../services/api', () => ({
  ordersApi: {
    updateStatus: vi.fn().mockResolvedValue({}),
    cancel:       vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../../utils/printTicket', () => ({
  printKitchenTicket: vi.fn(),
}))

import { ordersApi } from '../../services/api'
import { printKitchenTicket } from '../../utils/printTicket'

const baseOrder = {
  id: 'order-1',
  status: 'new',
  customer_name: 'Alice Smith',
  customer_phone: '+14155550000',
  created_at: '2024-01-15T14:30:00Z',
  total: 24.5,
  payment_status: 'pending',
  pay_method: 'cash',
  call_sid: 'CA123',
  items: [
    { name: 'Burger', quantity: 2, modification: 'No onions' },
    { name: 'Fries', quantity: 1 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  // Prevent window.confirm from throwing
  vi.stubGlobal('confirm', () => true)
})

// ── Rendering ─────────────────────────────────────────────────────────────

describe('OrderCard rendering', () => {
  it('displays customer name', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('displays customer phone', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('+14155550000')).toBeInTheDocument()
  })

  it('shows "Unknown" when customer_name is absent', () => {
    render(<OrderCard order={{ ...baseOrder, customer_name: null }} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders all order items with quantities', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('Burger')).toBeInTheDocument()
    expect(screen.getByText('Fries')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders item modification when present', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('No onions')).toBeInTheDocument()
  })

  it('displays order total', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('$24.50')).toBeInTheDocument()
  })

  it('shows payment status badge', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows "Walk-in" badge when call_sid is absent', () => {
    render(<OrderCard order={{ ...baseOrder, call_sid: null }} />)
    expect(screen.getByText('Walk-in')).toBeInTheDocument()
  })

  it('does NOT show "Walk-in" badge when call_sid is present', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.queryByText('Walk-in')).not.toBeInTheDocument()
  })

  it('shows special instructions when present', () => {
    render(<OrderCard order={{ ...baseOrder, special_instructions: 'Extra spicy please' }} />)
    expect(screen.getByText('Extra spicy please')).toBeInTheDocument()
  })

  it('does not show special instructions block when absent', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.queryByText('Extra spicy please')).not.toBeInTheDocument()
  })

  it('shows the correct status label for "new" orders', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows "Preparing" label for preparing status', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'preparing' }} />)
    expect(screen.getByText('Preparing')).toBeInTheDocument()
  })
})

// ── Status progression ─────────────────────────────────────────────────────

describe('OrderCard status progression', () => {
  it('shows "Confirm" button for new orders', () => {
    render(<OrderCard order={baseOrder} />)
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('calls updateStatus with next status on advance click', async () => {
    const onStatusChange = vi.fn()
    render(<OrderCard order={baseOrder} onStatusChange={onStatusChange} />)

    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(ordersApi.updateStatus).toHaveBeenCalledWith('order-1', 'confirmed')
      expect(onStatusChange).toHaveBeenCalled()
    })
  })

  it('shows "Start Preparing" for confirmed orders', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'confirmed' }} />)
    expect(screen.getByText('Start Preparing')).toBeInTheDocument()
  })

  it('shows "Mark Ready" for preparing orders', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'preparing' }} />)
    expect(screen.getByText('Mark Ready')).toBeInTheDocument()
  })

  it('shows "Picked Up" for ready orders', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'ready' }} />)
    expect(screen.getByText('Picked Up')).toBeInTheDocument()
  })

  it('hides action buttons for completed (picked_up) orders', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'picked_up' }} />)
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('hides action buttons for cancelled orders', () => {
    render(<OrderCard order={{ ...baseOrder, status: 'cancelled' }} />)
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })
})

// ── Cancel ────────────────────────────────────────────────────────────────

describe('OrderCard cancel', () => {
  it('calls cancel API after user confirms', async () => {
    const onStatusChange = vi.fn()
    render(<OrderCard order={baseOrder} onStatusChange={onStatusChange} />)

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(ordersApi.cancel).toHaveBeenCalledWith('order-1')
      expect(onStatusChange).toHaveBeenCalled()
    })
  })

  it('does NOT cancel if user dismisses confirm dialog', async () => {
    vi.stubGlobal('confirm', () => false)
    render(<OrderCard order={baseOrder} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(ordersApi.cancel).not.toHaveBeenCalled()
  })
})

// ── Print ─────────────────────────────────────────────────────────────────

describe('OrderCard print', () => {
  it('calls printKitchenTicket with order and restaurantName', () => {
    render(<OrderCard order={baseOrder} restaurantName="My Bistro" />)
    fireEvent.click(screen.getByText('Print'))
    expect(printKitchenTicket).toHaveBeenCalledWith(baseOrder, 'My Bistro')
  })
})
