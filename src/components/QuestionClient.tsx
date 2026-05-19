'use client';

import { useState } from 'react';
import styles from '@/app/admin/admin.module.css';
import { addQuestion, editQuestion, deleteQuestion, bulkAddQuestions } from '@/app/admin/actions';
import Papa from 'papaparse';

export default function QuestionClient({ initialCategories, initialQuestions }: { initialCategories: any[], initialQuestions: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    Papa.parse(e.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        // Map CSV fields to DB format
        // Expected CSV Headers: categoryId, text, optA, optB, optC, optD, correctAnswer, explanation
        const questionsToAdd = results.data.map((row: any) => ({
          categoryId: row.categoryId,
          text: row.text,
          options: JSON.stringify([row.optA, row.optB, row.optC, row.optD]),
          correctAnswer: row.correctAnswer,
          explanation: row.explanation || null,
        })).filter(q => q.categoryId && q.text && q.correctAnswer);

        if (questionsToAdd.length > 0) {
          await bulkAddQuestions(questionsToAdd);
          alert(`Successfully added ${questionsToAdd.length} questions!`);
        } else {
          alert('No valid questions found in CSV.');
        }
      }
    });
  };

  const editItem = initialQuestions.find(q => q.id === editingId);
  const opts = editItem ? JSON.parse(editItem.options) : ['', '', '', ''];

  return (
    <div className={styles.flex}>
      <div style={{ flex: 1 }}>
        <div className="card glass" style={{ marginBottom: '2rem' }}>
          <h3>{editingId ? 'Edit Question' : 'Add New Question'}</h3>
          <form 
            action={editingId ? editQuestion : addQuestion} 
            onSubmit={() => setTimeout(() => { setEditingId(null); setImageUrl(''); }, 100)}
            style={{ marginTop: '1rem' }}
          >
            {editingId && <input type="hidden" name="id" value={editingId} />}
            <input type="hidden" name="imageUrl" value={imageUrl || (editItem?.imageUrl ?? '')} />

            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select name="categoryId" required className={styles.select} defaultValue={editItem?.categoryId || ''} key={`cat-${editingId}`}>
                <option value="">Select Category</option>
                {initialCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Question Text</label>
              <textarea name="text" required rows={3} className={styles.textarea} defaultValue={editItem?.text || ''} key={`txt-${editingId}`} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Image Diagram (Optional)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'block' }} />
              {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'var(--warning-color)' }}>Uploading...</span>}
              {(imageUrl || editItem?.imageUrl) && (
                <img src={imageUrl || editItem?.imageUrl} alt="preview" style={{ maxHeight: '100px', marginTop: '0.5rem', borderRadius: '0.5rem' }} />
              )}
            </div>
            
            <div className={styles.flex}>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label className={styles.label}>Option A</label>
                <input type="text" name="optA" required className={styles.input} defaultValue={opts[0]} key={`optA-${editingId}`} />
              </div>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label className={styles.label}>Option B</label>
                <input type="text" name="optB" required className={styles.input} defaultValue={opts[1]} key={`optB-${editingId}`} />
              </div>
            </div>
            <div className={styles.flex}>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label className={styles.label}>Option C</label>
                <input type="text" name="optC" required className={styles.input} defaultValue={opts[2]} key={`optC-${editingId}`} />
              </div>
              <div className={styles.formGroup} style={{flex: 1}}>
                <label className={styles.label}>Option D</label>
                <input type="text" name="optD" required className={styles.input} defaultValue={opts[3]} key={`optD-${editingId}`} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Correct Answer (A, B, C, or D)</label>
              <select name="correctAnswer" required className={styles.select} defaultValue={editItem?.correctAnswer || "0"} key={`ans-${editingId}`}>
                <option value="0">Option A</option>
                <option value="1">Option B</option>
                <option value="2">Option C</option>
                <option value="3">Option D</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Explanation (Optional)</label>
              <textarea name="explanation" rows={2} className={styles.textarea} defaultValue={editItem?.explanation || ''} key={`exp-${editingId}`} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Add Question'}
              </button>
              {editingId && (
                <button type="button" className="btn" onClick={() => {setEditingId(null); setImageUrl('')}} style={{ border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card glass">
          <h3 style={{ marginBottom: '1rem' }}>Bulk Upload (CSV)</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            CSV Headers required: categoryId, text, optA, optB, optC, optD, correctAnswer (0-3), explanation
          </p>
          <input type="file" accept=".csv" onChange={handleCSVUpload} className={styles.input} />
        </div>
      </div>

      <div className="card glass" style={{ flex: 1, maxHeight: '800px', overflowY: 'auto' }}>
        <h3>Question Bank</h3>
        <div>
          {initialQuestions.length === 0 ? (
            <p>No questions found.</p>
          ) : (
            initialQuestions.map(q => {
              const qOpts = JSON.parse(q.options);
              const correctIdx = parseInt(q.correctAnswer);
              return (
                <div key={q.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{q.category?.name || 'Unknown'}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditingId(q.id)} style={{ color: 'var(--secondary-color)', fontSize: '0.8rem' }}>Edit</button>
                      <form action={deleteQuestion}>
                        <input type="hidden" name="id" value={q.id} />
                        <button type="submit" className={styles.dangerText} style={{fontSize: '0.8rem'}}>Delete</button>
                      </form>
                    </div>
                  </div>
                  <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>{q.text}</p>
                  {q.imageUrl && <img src={q.imageUrl} style={{maxHeight: '100px', marginTop: '0.5rem'}} alt="diagram" />}
                  <ul style={{ listStyle: 'none', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {qOpts.map((opt: string, i: number) => (
                      <li key={i} style={{ color: i === correctIdx ? 'var(--secondary-color)' : 'var(--text-muted)' }}>
                        {String.fromCharCode(65 + i)}. {opt} {i === correctIdx && '✓'}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
