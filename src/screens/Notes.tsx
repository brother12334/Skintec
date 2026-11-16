import { useStore } from '../store/store';
import { PLAN_NOTES, PRODUCT_IDS } from '../data/defaults';

/** Everything from the plan, in one place to read before bed. */
export function NotesScreen() {
  const { state } = useStore();
  const products = state.products.filter((p) => p.active);

  return (
    <>
      <section className="hero">
        <span className="kicker">Your plan</span>
        <h1 className="big">Notes</h1>
        <span className="pill">Read once, then just follow Today</span>
      </section>

      <section className="note-block">
        <h2 className="subtitle">What you’re using</h2>
        <ul className="steps">
          {products.map((p) => (
            <li key={p.id}>
              <span className="t">
                {p.name}
                {p.id === PRODUCT_IDS.adapalene ? (
                  <small>
                    You’ll need to buy this. It’s sold over the counter. Check with your dapsone prescriber before adding it.
                  </small>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {PLAN_NOTES.map((block) => (
        <section className="note-block" key={block.title}>
          <h2 className="subtitle">{block.title}</h2>
          <ul className="note-list">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <p className="st-xs st-muted st-center">Your dermatologist or prescriber’s instructions always come first.</p>
    </>
  );
}
