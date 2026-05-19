'use client';
import { useState, useMemo, useTransition } from 'react';
import { deleteResultAction, toggleArchiveResultAction } from '@/app/admin/actions';
import styles from '@/app/admin/admin.module.css';
import { useRouter } from 'next/navigation';

type ResultItem = {
  id: string;
  studentName: string;
  categoryId: string;
  score: number;
  total: number;
  isArchived: boolean;
  createdAt: Date;
  category?: { name: string } | null;
};

export default function ResultsClient({ initialResults }: { initialResults: ResultItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('dateDesc'); // dateDesc, scoreDesc, scoreAsc
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleArchive = (id: string, isArchived: boolean) => {
    startTransition(async () => {
      await toggleArchiveResultAction(id, isArchived);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteResultAction(id);
    });
  };

  const filteredAndSortedResults = useMemo(() => {
    let list = initialResults.filter(r => (activeTab === 'archived' ? r.isArchived : !r.isArchived));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.studentName.toLowerCase().includes(q) || 
        (r.category?.name?.toLowerCase() || '').includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortType === 'scoreDesc') {
        const pA = a.total > 0 ? (a.score / a.total) : 0;
        const pB = b.total > 0 ? (b.score / b.total) : 0;
        return pB - pA;
      }
      if (sortType === 'scoreAsc') {
        const pA = a.total > 0 ? (a.score / a.total) : 0;
        const pB = b.total > 0 ? (b.score / b.total) : 0;
        return pA - pB;
      }
      // default: dateDesc
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [initialResults, searchQuery, sortType, activeTab]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('active')}
          >
            Active
          </button>
          <button 
            className={`btn ${activeTab === 'archived' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by student or category..." 
            className={styles.input}
            style={{ width: '250px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className={styles.select} 
            style={{ width: 'auto' }}
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="dateDesc">Newest First</option>
            <option value="scoreDesc">Highest Score</option>
            <option value="scoreAsc">Lowest Score</option>
          </select>
        </div>
      </div>

      <div className="card glass" style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Student Name</th>
              <th>Category</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedResults.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No results found.</td>
              </tr>
            ) : (
              filteredAndSortedResults.map(r => {
                const percentage = Math.round((r.score / r.total) * 100);
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.studentName}</td>
                    <td>{r.category?.name || 'Unknown Category'}</td>
                    <td>{r.score} / {r.total}</td>
                    <td style={{ color: percentage >= 75 ? 'var(--secondary-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                      {percentage}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleToggleArchive(r.id, !r.isArchived)}
                          disabled={isPending}
                          className={styles.navItem} 
                          style={{ padding: '0.2rem 0.5rem', width: 'auto', color: 'var(--primary-color)' }}
                        >
                          {r.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          disabled={isPending}
                          className={styles.dangerText}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
