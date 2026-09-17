export interface Employee { nip: string; name: string; }
export interface Contract { id: number; nip: string; employeeName: string; startDate: string; endDate: string; createdByNip: string; createdByName: string; updatedByNip?: string; createdAt: string; updatedAt: string; status: string; remainingDays: number; }
export interface Page<T> { items: T[]; page: number; limit: number; total: number; totalPages: number; }
