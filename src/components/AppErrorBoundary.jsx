import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-error-page">
        <section className="app-error-card">
          <div className="app-error-icon">!</div>
          <h1>Page could not load</h1>
          <p>{this.state.error.message || 'Something went wrong while starting the app.'}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </section>
      </main>
    )
  }
}
