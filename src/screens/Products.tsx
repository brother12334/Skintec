import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import type { Product, ProductCategory } from '../types';
import { getDailyRoutine } from '../engine/scheduler';
import { SkinTecIcon, STEP_ICON } from '../icons/SkinTecIcon';
import { Badge, Button, Field, Modal, Notice, Switch, useToast } from '../components/ui';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'cleanser', label: 'Cleanser' },
  { value: 'moisturizer', label: 'Moisturizer' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'sunscreen', label: 'Sunscreen' },
  { value: 'mask', label: 'Mask' },
  { value: 'serum', label: 'Serum' },
  { value: 'other', label: 'Other' },
];

function usageOf(product: Product, usedIds: Set<string>): string {
  if (usedIds.has(product.id)) return 'In your current routines';
  if (product.category === 'mask') return 'Scheduled on recovery nights';
  return 'In your library — not currently scheduled';
}

function compatibilityOf(product: Product): string | null {
  if (product.id === 'retinol') return 'Never scheduled on a tretinoin night';
  if (product.id === 'alaskan-volcano-mask') return 'Recovery nights only · never with LaserDerm';
  if (product.id === 'tretinoin') return 'Always inside the moisturizer sandwich';
  return null;
}

export function ProductsScreen({ today }: { today: string }) {
  const { state, upsertProduct, removeProduct } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const usedIds = useMemo(() => {
    const routine = getDailyRoutine(state, today);
    const ids = [...routine.am.steps, ...routine.pm.steps].map((s) => s.productId).filter(Boolean);
    return new Set(ids as string[]);
  }, [state, today]);

  const grouped = useMemo(() => {
    const map = new Map<ProductCategory, Product[]>();
    for (const product of state.products) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return CATEGORIES.map((c) => ({ ...c, items: map.get(c.value) ?? [] })).filter((g) => g.items.length > 0);
  }, [state.products]);

  function blankProduct(): Product {
    return {
      id: `product-${Date.now()}`,
      name: '',
      category: 'other',
      notes: '',
      active: true,
    };
  }

  return (
    <>
      <header className="st-mt-4">
        <p className="st-eyebrow">Products</p>
        <h1 className="st-screen-title">Your library</h1>
        <p className="st-screen-sub">Editing a product updates its name everywhere. Your schedule stays intact.</p>
      </header>

      <div className="st-mt-4">
        <Button variant="primary" block icon="add" onClick={() => setEditing(blankProduct())}>
          Add product
        </Button>
      </div>

      {grouped.map((group) => (
        <section className="st-section" key={group.value}>
          <h2 className="st-section-title">{group.label}</h2>
          <div className="st-stack-sm">
            {group.items.map((product) => {
              const compatibility = compatibilityOf(product);
              return (
                <div className="st-card" key={product.id} style={{ padding: 'var(--st-4)' }}>
                  <div className="st-flex-between">
                    <div className="st-flex" style={{ minWidth: 0 }}>
                      <SkinTecIcon name={STEP_ICON[product.category] ?? 'products'} size={22} />
                      <div style={{ minWidth: 0 }}>
                        <div className="st-row-title">{product.name}</div>
                        <div className="st-row-sub">{usageOf(product, usedIds)}</div>
                      </div>
                    </div>
                    <Switch
                      checked={product.active}
                      label={`${product.name} active`}
                      onChange={(next) => upsertProduct({ ...product, active: next })}
                    />
                  </div>

                  <div className="st-chip-row st-mt-3">
                    <Badge tone={product.active ? 'recovery' : 'neutral'} icon={product.active ? 'completion' : 'pause'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                    {compatibility ? (
                      <Badge tone="treat" icon="compatibility">
                        {compatibility}
                      </Badge>
                    ) : null}
                  </div>

                  {product.notes ? <p className="st-xs st-muted st-mt-3">{product.notes}</p> : null}

                  <div className="st-flex st-mt-3">
                    <Button variant="secondary" small icon="edit" onClick={() => setEditing(product)}>
                      Edit
                    </Button>
                    <Button variant="danger" small icon="delete" onClick={() => setConfirmDelete(product)}>
                      {product.builtIn ? 'Deactivate' : 'Remove'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {editing ? (
        <Modal title={editing.name ? 'Edit product' : 'Add product'} onClose={() => setEditing(null)}>
          <Field label="Name" htmlFor="product-name">
            <input
              id="product-name"
              className="st-input"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Anua First Cleanser"
            />
          </Field>
          <Field label="Category" htmlFor="product-category">
            <select
              id="product-category"
              className="st-select"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value as ProductCategory })}
              disabled={editing.builtIn}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" htmlFor="product-notes" hint="Optional — how you use it, or what your prescriber said.">
            <textarea
              id="product-notes"
              className="st-textarea"
              value={editing.notes ?? ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
          </Field>
          {editing.builtIn ? (
            <Notice tone="plain" icon="info">
              This product is part of your scheduled routines. You can rename it and add notes; its category
              stays fixed so the schedule keeps working.
            </Notice>
          ) : null}
          <div className="st-mt-4">
            <Button
              variant="primary"
              block
              icon="completion"
              disabled={!editing.name.trim()}
              onClick={() => {
                const original = state.products.find((p) => p.id === editing.id);
                const renamed = original ? original.name !== editing.name.trim() : false;
                upsertProduct({
                  ...editing,
                  name: editing.name.trim(),
                  // A renamed product shows the user's own wording everywhere.
                  shortName: renamed ? undefined : editing.shortName,
                });
                setEditing(null);
                toast('Product saved');
              }}
            >
              Save product
            </Button>
          </div>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal title={confirmDelete.builtIn ? 'Deactivate product' : 'Remove product'} onClose={() => setConfirmDelete(null)}>
          <p className="st-soft">
            {confirmDelete.builtIn
              ? `${confirmDelete.name} is used by your scheduled routines, so SkinTec will deactivate it rather than delete it. You can turn it back on at any time.`
              : `${confirmDelete.name} will be removed from your library.`}
          </p>
          <div className="st-mt-6 st-stack-sm">
            <Button
              variant="danger"
              block
              icon="delete"
              onClick={() => {
                removeProduct(confirmDelete.id);
                toast(confirmDelete.builtIn ? 'Product deactivated' : 'Product removed', 'delete');
                setConfirmDelete(null);
              }}
            >
              {confirmDelete.builtIn ? 'Deactivate' : 'Remove'}
            </Button>
            <Button variant="ghost" block onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
