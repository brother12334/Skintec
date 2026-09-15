import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SkinTecIcon, SkinTecMark } from './icons/SkinTecIcon';

type State = { error: Error | null };

/** Last-resort recovery: never leave the user without a usable routine. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SkinTec error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="st-app">
        <main className="st-main st-mt-6">
          <div className="st-center st-mt-6">
            <SkinTecMark size={54} />
          </div>
          <section className="st-card st-mt-4 st-center">
            <div style={{ color: 'var(--st-peach-600)' }}>
              <SkinTecIcon name="warning" size={40} strokeWidth={1.5} />
            </div>
            <h1 className="st-card-title st-mt-3">Something went wrong</h1>
            <p className="st-soft st-mt-2">
              SkinTec could not draw this screen. Your data is still saved on this device.
            </p>
            <div className="st-mt-4 st-stack-sm">
              <button className="st-btn st-btn-primary st-btn-block" type="button" onClick={() => window.location.reload()}>
                Reload SkinTec
              </button>
              <button
                className="st-btn st-btn-danger st-btn-block"
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('skintec.state.v1');
                  } catch {
                    // ignore
                  }
                  window.location.reload();
                }}
              >
                Reset saved data and reload
              </button>
            </div>
            <p className="st-xs st-muted st-mt-4">
              Fallback routine: cleanse, cleanse, moisturize tonight. Sunscreen in the morning.
            </p>
          </section>
        </main>
      </div>
    );
  }
}
