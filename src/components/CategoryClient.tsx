'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/admin/admin.module.css';
import { addCategory, deleteCategory, editCategory } from '@/app/admin/actions';

export default function CategoryClient({ initialCategories }: { initialCategories: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const editCat = editingId ? initialCategories.find(c => c.id === editingId) : null;
  
  const [timerHours, setTimerHours] = useState('0');
  const [timerMinutes, setTimerMinutes] = useState('0');
  const [timerSeconds, setTimerSeconds] = useState('0');

  useEffect(() => {
    const secs = editCat?.examTimerSeconds || 0;
    setTimerHours(Math.floor(secs / 3600).toString());
    setTimerMinutes(Math.floor((secs % 3600) / 60).toString());
    setTimerSeconds((secs % 60).toString());
  }, [editingId, editCat]);

  const h = parseInt(timerHours) || 0;
  const m = parseInt(timerMinutes) || 0;
  const s = parseInt(timerSeconds) || 0;
  const totalSeconds = (h * 3600) + (m * 60) + s;

  return (
    <div className={styles.flex}>
      <div className="card glass" style={{ flex: 1 }}>
        <h3>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
        <form 
          action={editingId ? editCategory : addCategory} 
          onSubmit={() => setTimeout(() => setEditingId(null), 100)}
          style={{ marginTop: '1rem' }}
        >
          {editingId && <input type="hidden" name="id" value={editingId} />}
          <div className={styles.formGroup}>
            <label className={styles.label}>Category Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              className={styles.input} 
              placeholder="e.g., General Education" 
              defaultValue={editingId ? initialCategories.find(c => c.id === editingId)?.name : ''}
              key={editingId ? `name-${editingId}` : 'name-new'}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea 
              name="description" 
              rows={3} 
              className={styles.textarea} 
              placeholder="Optional description..."
              defaultValue={editingId ? initialCategories.find(c => c.id === editingId)?.description : ''}
              key={editingId ? `desc-${editingId}` : 'desc-new'}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Exam Timer (Total: {totalSeconds}s)</label>
            <input type="hidden" name="examTimerSeconds" value={totalSeconds} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hours</label>
                <input type="number" min="0" value={timerHours} onChange={e => setTimerHours(e.target.value)} className={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minutes</label>
                <input type="number" min="0" max="59" value={timerMinutes} onChange={e => setTimerMinutes(e.target.value)} className={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seconds</label>
                <input type="number" min="0" max="59" value={timerSeconds} onChange={e => setTimerSeconds(e.target.value)} className={styles.input} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save Changes' : 'Add Category'}
            </button>
            {editingId && (
              <button type="button" className="btn" onClick={() => setEditingId(null)} style={{ border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card glass" style={{ flex: 2 }}>
        <h3>Existing Categories</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Timer</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialCategories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>No categories found.</td>
              </tr>
            ) : (
              initialCategories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>{cat.examTimerSeconds ? `${cat.examTimerSeconds}s` : 'None'}</td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => setEditingId(cat.id)} style={{ color: 'var(--secondary-color)' }}>Edit</button>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={cat.id} />
                        <button type="submit" className={styles.dangerText}>Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
