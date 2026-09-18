import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Contract } from '../types';
import { ErrorMessage, Spinner } from '../components/States';

const date = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID');

export function ContractDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const [item, setItem] = useState<Contract>(); const [error, setError] = useState('');
  useEffect(() => { api.contract(Number(id)).then(setItem).catch(caught => setError(caught.message)); }, [id]);
  if (error) return <ErrorMessage message={error} />; if (!item) return <Spinner />;
  const remove = async () => { if (!confirm(`Hapus data kontrak ${item.employeeName}? Data yang dihapus tidak dapat dikembalikan.`)) return; try { await api.remove(item.id); navigate('/dashboard'); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Kontrak gagal dihapus.'); } };
  return <div className="mx-auto max-w-2xl"><Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm text-bmc-muted"><ArrowLeft size={16} />Kembali ke Dashboard</Link><div className="border border-bmc-border bg-white p-6 sm:p-8"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-bmc-navy">Monitoring kontrak</p><h1 className="text-xl font-semibold">Detail Kontrak Karyawan</h1><dl className="mt-7 grid gap-5 sm:grid-cols-2"><div><dt className="label">Nama</dt><dd>{item.employeeName}</dd></div><div><dt className="label">NIP</dt><dd>{item.nip}</dd></div><div><dt className="label">Departemen</dt><dd>{item.department || '-'}</dd></div><div><dt className="label">Nomor Kontrak</dt><dd>{item.contractNumber || '-'}</dd></div><div><dt className="label">Tanggal Awal Kontrak</dt><dd>{date(item.startDate)}</dd></div><div><dt className="label">Tanggal Akhir Kontrak</dt><dd>{date(item.endDate)}</dd></div><div><dt className="label">Status</dt><dd>{item.status}</dd></div><div><dt className="label">Sisa hari</dt><dd>{item.remainingDays < 0 ? `Berakhir ${Math.abs(item.remainingDays)} hari lalu` : `${item.remainingDays} hari`}</dd></div><div><dt className="label">Diinput Oleh</dt><dd>{item.createdByName}</dd></div></dl><div className="mt-7 flex gap-3"><Link to={`/contracts/${item.id}/edit`} className="btn-secondary"><Edit size={16} />Edit</Link><button onClick={remove} className="btn-secondary text-red-700"><Trash2 size={16} />Hapus</button></div></div></div>;
}
