import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { PartChange, Profile } from '@/lib/types';
import { Loader2, History as HistoryIcon, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow } from 'date-fns';

interface ChangeWithCreator extends PartChange {
  creator?: Profile;
}

export default function History() {
  const { user } = useAuth();
  const [changes, setChanges] = useState<ChangeWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChanges();
  }, []);

  async function fetchChanges() {
    setLoading(true);
    try {
      const { data: changesData } = await supabase
        .from('part_changes')
        .select('*')
        .order('created_at', { ascending: false });

      if (changesData) {
        // Fetch creators
        const changesWithCreators = await Promise.all(
          changesData.map(async (change) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', change.created_by)
              .single();
            return { ...change, creator: profileData || undefined } as ChangeWithCreator;
          })
        );
        setChanges(changesWithCreators);
      }
    } catch (error) {
      console.error('Error fetching changes:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredChanges = changes.filter(
    (change) =>
      change.part_name.toLowerCase().includes(search.toLowerCase()) ||
      change.description.toLowerCase().includes(search.toLowerCase()) ||
      change.part_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-primary" />
              Change History
            </h1>
            <p className="text-muted-foreground mt-1">View all past part changes</p>
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

        {/* Changes List */}
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
                          <StatusBadge status={change.status} />
                        </div>
                        {change.part_id && (
                          <p className="text-sm font-mono text-muted-foreground">{change.part_id}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {change.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>By {change.creator?.full_name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{format(new Date(change.created_at), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}</span>
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
    </AppLayout>
  );
}
