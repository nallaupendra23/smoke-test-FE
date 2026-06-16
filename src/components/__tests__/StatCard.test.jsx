import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

// requestAnimationFrame is not available in jsdom — stub it so AnimatedNumber
// settles to the final value immediately.
beforeAll(() => {
  vi.stubGlobal('requestAnimationFrame', (cb) => { cb(performance.now() + 1000); return 1 })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total Orders" value="42" />)
    expect(screen.getByText('Total Orders')).toBeInTheDocument()
  })

  it('renders a string icon', () => {
    render(<StatCard label="Revenue" value="$100" icon="💰" />)
    expect(screen.getByText('💰')).toBeInTheDocument()
  })

  it('renders a component icon', () => {
    const FakeIcon = ({ size }) => <svg data-testid="svg-icon" width={size} />
    render(<StatCard label="Calls" value="5" icon={FakeIcon} />)
    expect(screen.getByTestId('svg-icon')).toBeInTheDocument()
  })

  it('renders sub text when provided', () => {
    render(<StatCard label="Revenue" value="$500" sub="last 30 days" />)
    expect(screen.getByText('last 30 days')).toBeInTheDocument()
  })

  it('does not render sub text when omitted', () => {
    render(<StatCard label="Revenue" value="$500" />)
    expect(screen.queryByText('last 30 days')).not.toBeInTheDocument()
  })

  it('shows green trend badge for positive trend', () => {
    render(<StatCard label="Orders" value="10" trend={12} />)
    const badge = screen.getByText(/12%/)
    expect(badge).toHaveStyle({ color: '#166534' })
  })

  it('shows red trend badge for negative trend', () => {
    render(<StatCard label="Orders" value="10" trend={-5} />)
    const badge = screen.getByText(/5%/)
    expect(badge).toHaveStyle({ color: '#b91c1c' })
  })

  it('does not render trend badge when trend is undefined', () => {
    render(<StatCard label="Orders" value="10" />)
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('uses blue icon class by default', () => {
    const { container } = render(<StatCard label="X" value="1" icon="🔵" />)
    expect(container.querySelector('.stat-icon-blue')).toBeInTheDocument()
  })

  it('uses the correct color class for green', () => {
    const { container } = render(<StatCard label="X" value="1" icon="🟢" color="green" />)
    expect(container.querySelector('.stat-icon-green')).toBeInTheDocument()
  })

  it('falls back to blue class for unknown color', () => {
    const { container } = render(<StatCard label="X" value="1" color="magenta" />)
    expect(container.querySelector('.stat-icon-blue')).toBeInTheDocument()
  })
})
