import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  TrendingUp,
  Users,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  BookOpen,
  Lock,
  Unlock,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomCard } from '@/components/Room/RoomCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/types/api';
import { RoomService } from '@/services/api';

// Academic subjects for filtering
const SUBJECTS = [
  'All Subjects',
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Medicine',
  'Literature',
  'History',
  'Psychology',
  'Economics',
  'Business',
  'Art',
  'Music',
  'Philosophy',
  'Political Science',
  'Sociology',
  'Anthropology',
  'Geography',
  'Environmental Science',
  'Other'
];

// Filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All Rooms' },
  { value: 'joined', label: 'Joined' },
  { value: 'created', label: 'Created by Me' },
  { value: 'active', label: 'Active' },
  { value: 'trending', label: 'Trending' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'members', label: 'Most Members' },
];

interface RoomManagementProps {
  mode: 'my-rooms' | 'explore';
  title: string;
  description: string;
}

export function RoomManagement({ mode, title, description }: RoomManagementProps) {
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrivateRooms, setShowPrivateRooms] = useState(false);
  const [showAIEnabled, setShowAIEnabled] = useState(false);
  
  const itemsPerPage = 12;

  // Hooks
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch rooms based on mode with professional-grade querying
  const { data: allRooms = [], isLoading, error } = useQuery({
    queryKey: [
      mode === 'my-rooms' ? 'rooms-joined' : 'rooms-explore',
      selectedFilter,
      selectedSubject,
      selectedSort,
      searchQuery,
      showPrivateRooms,
      showAIEnabled
    ],
    queryFn: async () => {
      console.log(`[RoomManagement] Fetching ${mode} rooms using API service`);
      
      if (mode === 'my-rooms') {
        // Use API service for joined rooms
        const response = await RoomService.getJoinedRooms();
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch joined rooms');
        }
        console.log(`[RoomManagement] Fetched ${response.data?.length || 0} joined rooms`);
        return response.data || [];
      } else {
        // Use API service for explore rooms with parameters
        const exploreParams: any = {};
        
        // Search query parameter
        if (searchQuery.trim()) {
          exploreParams.search = searchQuery.trim();
        }
        
        // Subject filtering
        if (selectedSubject !== 'All Subjects') {
          exploreParams.subject = selectedSubject;
        }
        
        // Activity filters
        if (selectedFilter === 'active') exploreParams.active = true;
        if (selectedFilter === 'trending') exploreParams.trending = true;
        if (selectedFilter === 'joined') exploreParams.userJoined = false;
        if (selectedFilter === 'created') exploreParams.createdByUser = user?.id || '';
        
        // Privacy filter
        if (!showPrivateRooms) exploreParams.excludePrivate = true;
        
        // AI-enabled filter
        if (showAIEnabled) exploreParams.aiEnabled = true;
        
        // Sorting parameters
        switch (selectedSort) {
          case 'recent':
            exploreParams.sortBy = 'createdAt';
            exploreParams.sortOrder = 'desc';
            break;
          case 'popular':
            exploreParams.sortBy = 'memberCount';
            exploreParams.sortOrder = 'desc';
            break;
          case 'alphabetical':
            exploreParams.sortBy = 'name';
            exploreParams.sortOrder = 'asc';
            break;
          case 'members':
            exploreParams.sortBy = 'memberCount';
            exploreParams.sortOrder = 'desc';
            break;
        }
        
        // Pagination and metadata parameters
        exploreParams.limit = 100;
        exploreParams.offset = 0;
        exploreParams.includeStats = true;
        exploreParams.includeMembershipStatus = true;
        
        const response = await RoomService.exploreRooms(exploreParams);
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch explore rooms');
        }
        console.log(`[RoomManagement] Fetched ${response.data?.length || 0} explore rooms`);
        return response.data || [];
      }
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds for better UX
    refetchOnWindowFocus: false,
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await authenticatedFetch(`/api/rooms/${roomId}/join`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/joined'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/public'] });
      toast({
        title: "Success",
        description: "You have joined the room successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    }
  });

  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await authenticatedFetch(`/api/rooms/${roomId}/leave`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/joined'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/public'] });
      toast({
        title: "Success",
        description: "You have left the room successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave room",
        variant: "destructive",
      });
    }
  });

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = [...allRooms];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.subject.toLowerCase().includes(query)
      );
    }

    // Apply subject filter
    if (selectedSubject !== 'All Subjects') {
      filtered = filtered.filter(room => room.subject === selectedSubject);
    }

    // Apply additional filters
    if (mode === 'my-rooms') {
      if (selectedFilter === 'created') {
        filtered = filtered.filter(room => room.createdBy === user?.id);
      }
    }

    // Apply privacy filter
    if (showPrivateRooms === false && mode === 'explore') {
      filtered = filtered.filter(room => !room.isPrivate);
    }

    // Apply AI filter
    if (showAIEnabled) {
      filtered = filtered.filter(room => room.aiEnabled);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'popular':
          return (b.messageCount || 0) - (a.messageCount || 0);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [allRooms, searchQuery, selectedSubject, selectedFilter, selectedSort, showPrivateRooms, showAIEnabled, mode, user?.id]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRooms.length / itemsPerPage);
  const paginatedRooms = filteredAndSortedRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useState(() => {
    setCurrentPage(1);
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('All Subjects');
    setSelectedFilter('all');
    setSelectedSort('recent');
    setShowPrivateRooms(false);
    setShowAIEnabled(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        
        {mode === 'my-rooms' && (
          <Link href="/create-room">
            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </Link>
        )}
      </div>

      {/* Trending Rooms Section (Explore mode only) */}
      {mode === 'explore' && filteredAndSortedRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Trending Rooms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {filteredAndSortedRooms.slice(0, 5).map((room: Room) => {
                const isMember = false; // In explore mode, user is not a member of these rooms
                return (
                  <div key={room.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{room.name}</h4>
                      {room.isPrivate ? <Lock className="w-3 h-3 text-gray-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="secondary" className="text-xs">{room.subject}</Badge>
                      {room.aiEnabled && <Brain className="w-3 h-3 text-accent-500" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{room.memberCount || 0} members</span>
                      <Button
                        size="sm"
                        variant={isMember ? "outline" : "default"}
                        onClick={() => {
                          if (isMember) {
                            leaveRoomMutation.mutate(room.id);
                          } else {
                            joinRoomMutation.mutate(room.id);
                          }
                        }}
                        disabled={joinRoomMutation.isPending || leaveRoomMutation.isPending}
                        className="text-xs px-2 py-1"
                      >
                        {isMember ? 'Leave' : 'Join'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search rooms by name, description, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-rooms"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Subject Filter */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Room Filter */}
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter rooms" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedSubject !== 'All Subjects' || selectedFilter !== 'all' || selectedSort !== 'recent' || showPrivateRooms || showAIEnabled) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mode === 'explore' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-private"
                      checked={showPrivateRooms}
                      onCheckedChange={(checked) => setShowPrivateRooms(checked === true)}
                    />
                    <label htmlFor="show-private" className="text-sm font-medium">
                      Include private rooms
                    </label>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai-enabled"
                    checked={showAIEnabled}
                    onCheckedChange={(checked) => setShowAIEnabled(checked === true)}
                  />
                  <label htmlFor="ai-enabled" className="text-sm font-medium">
                    AI-enabled rooms only
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedRooms.length} of {filteredAndSortedRooms.length} rooms
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Rooms Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[...Array(itemsPerPage)].map((_, i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'h-48 w-full' : 'h-24 w-full'} />
          ))}
        </div>
      ) : paginatedRooms.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || selectedSubject !== 'All Subjects' || selectedFilter !== 'all' 
              ? 'No rooms match your filters' 
              : 'No rooms found'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || selectedSubject !== 'All Subjects' || selectedFilter !== 'all'
              ? 'Try adjusting your search criteria or filters'
              : mode === 'my-rooms' 
                ? 'Start by creating a room or exploring existing ones'
                : 'Be the first to create a public room!'
            }
          </p>
          <div className="space-x-4">
            {(searchQuery || selectedSubject !== 'All Subjects' || selectedFilter !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            <Link href="/create-room">
              <Button>Create Room</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {paginatedRooms.map((room: Room) => {
            const isMember = mode === 'my-rooms';
            return (
              <RoomCard
                key={room.id}
                room={room}
                isMember={isMember}
                viewMode={viewMode}
                onJoin={() => joinRoomMutation.mutate(room.id)}
                onLeave={() => leaveRoomMutation.mutate(room.id)}
                isJoining={joinRoomMutation.isPending}
                isLeaving={leaveRoomMutation.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
