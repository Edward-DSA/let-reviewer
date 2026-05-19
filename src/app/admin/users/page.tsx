import { prisma } from '@/lib/prisma';
import styles from '../admin.module.css';
import { addUser, deleteUser, resetPassword } from '@/app/admin/actions';

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { username: 'asc' } });

  return (
    <div className="animate-fade-in">
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>User Management</h1>
      </header>

      <div className={styles.flex}>
        {/* Add User form */}
        <div className="card glass" style={{ flex: 1, minWidth: 260 }}>
          <h3 style={{ marginBottom: '1rem' }}>Add New Account</h3>
          <form action={addUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input type="text" name="username" required className={styles.input} placeholder="e.g., teacher_maria" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input type="password" name="password" required className={styles.input} placeholder="Minimum 6 characters" minLength={6} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Role</label>
              <select name="role" className={styles.select} defaultValue="TEACHER">
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add Account</button>
          </form>
        </div>

        {/* Users table */}
        <div className="card glass" style={{ flex: 2 }}>
          <h3 style={{ marginBottom: '1rem' }}>Accounts ({users.length})</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center' }}>No accounts found.</td></tr>
              ) : users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.username}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                      background: user.role === 'ADMIN' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)',
                      color: user.role === 'ADMIN' ? 'var(--primary-color)' : 'var(--secondary-color)',
                    }}>{user.role}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Reset password */}
                      <form action={resetPassword} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="password" name="password" placeholder="New password" minLength={6}
                          style={{
                            background: 'var(--surface-dark)', border: '1px solid var(--border-color)',
                            borderRadius: 6, color: 'var(--text-light)', padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 140,
                          }} />
                        <button type="submit" style={{ color: 'var(--warning-color)', fontSize: '0.8rem', fontWeight: 600 }}>Reset</button>
                      </form>
                      {/* Delete */}
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={user.id} />
                        <button type="submit" className={styles.dangerText} style={{ fontSize: '0.8rem' }}>Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
