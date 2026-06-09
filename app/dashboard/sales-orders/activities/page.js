'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  MessageSquare, 
  Tag, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';

const AVAILABLE_TAGS = ['URGENT', 'REVIEWED', 'FOLLOW_UP', 'APPROVED', 'PENDING'];

const ACTION_ICONS = {
  CREATED: <FileText className="w-4 h-4" />,
  APPROVED: <CheckCircle className="w-4 h-4 text-green-500" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-500" />,
  TAGGED: <Tag className="w-4 h-4 text-blue-500" />,
  COMMENTED: <MessageSquare className="w-4 h-4 text-purple-500" />,
};

const TAG_COLORS = {
  URGENT: 'bg-red-100 text-red-800 border-red-200',
  REVIEWED: 'bg-green-100 text-green-800 border-green-200',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function PurchaseOrderActivitiesPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTag, setFilterTag] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch('/api/purchase-orders');
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(data);
        if (data.length > 0 && !selectedPO) {
          setSelectedPO(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  // Fetch activities for selected PO
  const fetchActivities = async () => {
    if (!selectedPO) return;
    
    try {
      const res = await fetch(`/api/purchase-orders/${selectedPO.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Load activities when PO changes
  useEffect(() => {
    if (selectedPO) {
      fetchActivities();
    }
  }, [selectedPO]);

  // Real-time polling every 5 seconds (optimized from 3s)
  // Only poll when page is visible
  useEffect(() => {
    // Check if page is visible
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedPO) {
        fetchActivities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      // Only fetch if page is visible
      if (!document.hidden) {
        fetchPurchaseOrders();
        if (selectedPO) {
          fetchActivities();
        }
      }
    }, 5000); // Increased from 3000ms to 5000ms

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedPO]);

  // Add comment
  const handleAddComment = async () => {
    if (!comment.trim() && selectedTags.length === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${selectedPO.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: comment.trim() ? 'COMMENTED' : 'TAGGED',
          comment: comment.trim() || null,
          tags: selectedTags,
        }),
      });

      if (res.ok) {
        setComment('');
        setSelectedTags([]);
        fetchActivities();
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Filter activities by tag
  const filteredActivities = filterTag === 'all' 
    ? activities 
    : activities.filter(a => a.tags.includes(filterTag));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Order Activity Logs</h1>
          <p className="text-muted-foreground">
            Track all manager-vendor interactions in real-time
          </p>
        </div>
        <Button onClick={() => {
          fetchPurchaseOrders();
          fetchActivities();
        }} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Purchase Orders List */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Purchase Orders ({purchaseOrders.length})
            </CardTitle>
            <CardDescription>Select to view activity logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                onClick={() => setSelectedPO(po)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPO?.id === po.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{po.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {po.partner?.name || 'No vendor'}
                    </p>
                  </div>
                  <Badge variant={
                    po.status === 'APPROVED' ? 'default' :
                    po.status === 'PENDING_APPROVAL' ? 'secondary' :
                    po.status === 'REJECTED' ? 'destructive' : 'outline'
                  }>
                    {po.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(po.total)}</span>
                  <span>{formatDate(po.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Activity Timeline
                  {selectedPO && ` - ${selectedPO.number}`}
                </CardTitle>
                <CardDescription>
                  {selectedPO?.requestedBy?.name} requested from {selectedPO?.partner?.name}
                </CardDescription>
              </div>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {AVAILABLE_TAGS.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment Section */}
            {selectedPO && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Add Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`cursor-pointer ${
                            selectedTags.includes(tag)
                              ? TAG_COLORS[tag]
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Add Comment</label>
                    <Textarea
                      placeholder="Add a comment or note about this purchase order..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAddComment} 
                    disabled={submitting || (!comment.trim() && selectedTags.length === 0)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {submitting ? 'Adding...' : 'Add Activity'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Activities Timeline */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading activities...
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activities found</p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <Card key={activity.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-full">
                            {ACTION_ICONS[activity.action] || <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{activity.action}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              {activity.user?.name}
                              <span className="text-xs">({activity.user?.role})</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                      
                      {activity.comment && (
                        <div className="ml-12 mt-2 p-3 bg-muted/50 rounded-md">
                          <MessageSquare className="w-4 h-4 inline mr-2 text-muted-foreground" />
                          {activity.comment}
                        </div>
                      )}
                      
                      {activity.tags.length > 0 && (
                        <div className="ml-12 mt-2 flex flex-wrap gap-2">
                          {activity.tags.map((tag) => (
                            <Badge key={tag} className={TAG_COLORS[tag] || 'bg-gray-100'}>
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="ml-12 mt-2 text-xs text-muted-foreground">
                          {activity.metadata.total && (
                            <span>Amount: {formatCurrency(activity.metadata.total)}</span>
                          )}
                          {activity.metadata.status && (
                            <span className="ml-3">Status: {activity.metadata.status}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
