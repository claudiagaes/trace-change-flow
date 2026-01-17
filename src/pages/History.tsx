import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { History as HistoryIcon, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const DEMO_CHANGES = [
  { id: '1', part_name: 'Front Brake Caliper Assembly', part_id: 'BC-2024-001', description: 'Material change from aluminum to steel alloy for improved durability', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString(), creator: 'John Smith' },
  { id: '2', part_name: 'Engine Mount Bracket', part_id: 'EM-2024-015', description: 'Geometry update for new engine variant compatibility', status: 'pending_review', created_at: new Date(Date.now() - 172800000).toISOString(), creator: 'Sarah Johnson' },
  { id: '3', part_name: 'Door Handle Mechanism', part_id: 'DH-2024-042', description: 'Surface finish specification change for corrosion resistance', status: 'completed', created_at: new Date(Date.now() - 259200000).toISOString(), creator: 'Mike Chen' },
  { id: '4', part_name: 'Fuel Tank Assembly', part_id: 'FT-2024-008', description: 'Supplier change due to cost optimization', status: 'completed', created_at: new Date(Date.now() - 345600000).toISOString(), creator: 'Lisa Brown' },
  { id: '5', part_name: 'Steering Column Cover', part_id: 'SC-2024-023', description: 'Tolerance adjustment for improved fitment', status: 'draft', created_at: new Date(Date.now() - 432000000).toISOString(), creator: 'David Wilson' },
];

export default function History() {
  const [search, setSearch] = useState('');

  const filteredChanges = DEMO_CHANGES.filter(
    (change) =>
      change.part_name.toLowerCase().includes(search.toLowerCase()) ||
      change.description.toLowerCase().includes(search.toLowerCase()) ||
      change.part_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-primary" />
            ECN History
          </h1>
          <p className="text-muted-foreground mt-1">View all engineering change notices</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search changes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Changes</CardTitle>
          <CardDescription>{filteredChanges.length} total changes</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChanges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{search ? 'No changes match your search' : 'No changes yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChanges.map((change) => (
                <Link
                  key={change.id}
                  to={`/change/${change.id}`}
                  className="block p-4 border-2 rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold truncate">{change.part_name}</p>
                        <StatusBadge status={change.status as any} />
                      </div>
                      <p className="text-sm font-mono text-muted-foreground">{change.part_id}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{change.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>By {change.creator}</span>
                        <span>•</span>
                        <span>{format(new Date(change.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
