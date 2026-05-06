import { useState, useEffect, useCallback } from 'react';
import { MeetingMinutesList } from './MeetingMinutesList';
import { MeetingMinutesForm } from './MeetingMinutesForm';
import { salesLeadsApi, SalesLeadMeetingMinute } from '../services/salesLeads';
import { Loader2 } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface MeetingMinutesProps {
  prefillData?: Partial<SalesLeadMeetingMinute>;
}

export function MeetingMinutes({ prefillData }: MeetingMinutesProps = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<SalesLeadMeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesLeadsApi.getAllMinutes();
      setMinutes(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load meeting minutes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Expose for SalesLeads integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openMeetingMinutesForm = (data?: Partial<SalesLeadMeetingMinute>) => {
        setViewMode('create');
        setSelectedId(null);
      };
    }
  }, []);

  const handleSaved = () => {
    setViewMode('list');
    setSelectedId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    try {
      await salesLeadsApi.deleteMinute(id);
      setMinutes(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete');
    }
  };

  const selectedMinute = selectedId ? minutes.find(m => m.id === selectedId) ?? null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading meeting minutes…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {viewMode === 'list' && (
        <MeetingMinutesList
          meetingMinutes={minutes}
          onCreateNew={() => { setViewMode('create'); setSelectedId(null); }}
          onView={id => { setSelectedId(id); setViewMode('view'); }}
          onEdit={id => { setSelectedId(id); setViewMode('edit'); }}
          onDelete={handleDelete}
        />
      )}

      {viewMode === 'create' && (
        <MeetingMinutesForm
          mode="create"
          initialData={prefillData as SalesLeadMeetingMinute | undefined}
          onSaved={handleSaved}
          onCancel={() => setViewMode('list')}
        />
      )}

      {(viewMode === 'edit' || viewMode === 'view') && selectedMinute && (
        <MeetingMinutesForm
          initialData={selectedMinute}
          mode={viewMode}
          onSaved={handleSaved}
          onCancel={() => setViewMode('list')}
        />
      )}
    </div>
  );
}
