import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, MapPin, Pencil, Trash2, ToggleLeft, ToggleRight, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { format, parseISO, addMinutes, set as setDate } from 'date-fns';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEvents } from '@/hooks/useEvents';
import {
  useAdminMeetingSpots,
  useCreateMeetingSpot,
  useUpdateMeetingSpot,
  useDeleteMeetingSpot,
  MeetingSpot,
} from '@/hooks/useAdminMeetingSpots';
import {
  useAdminMeetingSlots,
  useCreateMeetingSlot,
  useUpdateMeetingSlot,
  useDeleteMeetingSlot,
  useBulkCreateMeetingSlots,
  MeetingSlot,
} from '@/hooks/useAdminMeetingSlots';

export default function AdminMeetingSpots() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: events } = useEvents();
  const event = events?.find((e) => e.id === eventId);
  
  // Meeting Spots (locations)
  const { data: spots, isLoading: spotsLoading } = useAdminMeetingSpots(eventId);
  const createSpot = useCreateMeetingSpot();
  const updateSpot = useUpdateMeetingSpot();
  const deleteSpot = useDeleteMeetingSpot();

  // Meeting Slots (time windows)
  const { data: slots, isLoading: slotsLoading } = useAdminMeetingSlots(eventId);
  const createSlot = useCreateMeetingSlot();
  const updateSlot = useUpdateMeetingSlot();
  const deleteSlot = useDeleteMeetingSlot();
  const bulkCreateSlots = useBulkCreateMeetingSlots();

  // Spot dialog state
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<MeetingSpot | null>(null);
  const [deleteSpotItem, setDeleteSpotItem] = useState<MeetingSpot | null>(null);
  const [spotFormData, setSpotFormData] = useState({
    name: '',
    location: '',
    capacity: 1,
  });

  // Slot dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<MeetingSlot | null>(null);
  const [deleteSlotItem, setDeleteSlotItem] = useState<MeetingSlot | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });

  // Bulk slot generator state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    breakBetween: 0,
    location: '',
  });

  // Spot handlers
  const handleOpenCreateSpot = () => {
    setEditingSpot(null);
    setSpotFormData({ name: '', location: '', capacity: 1 });
    setSpotDialogOpen(true);
  };

  const handleOpenEditSpot = (spot: MeetingSpot) => {
    setEditingSpot(spot);
    setSpotFormData({
      name: spot.name,
      location: spot.location || '',
      capacity: spot.capacity,
    });
    setSpotDialogOpen(true);
  };

  const handleSubmitSpot = async () => {
    if (!eventId || !spotFormData.name.trim()) return;

    if (editingSpot) {
      await updateSpot.mutateAsync({
        id: editingSpot.id,
        updates: {
          name: spotFormData.name.trim(),
          location: spotFormData.location.trim() || null,
          capacity: spotFormData.capacity,
        },
      });
    } else {
      await createSpot.mutateAsync({
        event_id: eventId,
        name: spotFormData.name.trim(),
        location: spotFormData.location.trim() || null,
        capacity: spotFormData.capacity,
      });
    }

    setSpotDialogOpen(false);
  };

  const handleToggleSpotActive = async (spot: MeetingSpot) => {
    await updateSpot.mutateAsync({
      id: spot.id,
      updates: { is_active: !spot.is_active },
    });
  };

  const handleDeleteSpot = async () => {
    if (!deleteSpotItem) return;
    await deleteSpot.mutateAsync(deleteSpotItem.id);
    setDeleteSpotItem(null);
  };

  // Slot handlers
  const handleOpenCreateSlot = () => {
    setEditingSlot(null);
    const defaultDate = event?.start_date 
      ? format(parseISO(event.start_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    setSlotFormData({ date: defaultDate, startTime: '09:00', endTime: '09:30', location: '' });
    setSlotDialogOpen(true);
  };

  const handleOpenEditSlot = (slot: MeetingSlot) => {
    setEditingSlot(slot);
    const startDate = parseISO(slot.start_time);
    const endDate = parseISO(slot.end_time);
    setSlotFormData({
      date: format(startDate, 'yyyy-MM-dd'),
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      location: slot.location || '',
    });
    setSlotDialogOpen(true);
  };

  const handleSubmitSlot = async () => {
    if (!eventId || !slotFormData.date || !slotFormData.startTime || !slotFormData.endTime) return;

    const startDateTime = `${slotFormData.date}T${slotFormData.startTime}:00`;
    const endDateTime = `${slotFormData.date}T${slotFormData.endTime}:00`;

    if (editingSlot) {
      await updateSlot.mutateAsync({
        id: editingSlot.id,
        updates: {
          start_time: startDateTime,
          end_time: endDateTime,
          location: slotFormData.location.trim() || null,
        },
      });
    } else {
      await createSlot.mutateAsync({
        event_id: eventId,
        start_time: startDateTime,
        end_time: endDateTime,
        location: slotFormData.location.trim() || null,
      });
    }

    setSlotDialogOpen(false);
  };

  const handleToggleSlotAvailable = async (slot: MeetingSlot) => {
    await updateSlot.mutateAsync({
      id: slot.id,
      updates: { is_available: !slot.is_available },
    });
  };

  const handleDeleteSlot = async () => {
    if (!deleteSlotItem) return;
    await deleteSlot.mutateAsync(deleteSlotItem.id);
    setDeleteSlotItem(null);
  };

  // Bulk slot generation
  const handleOpenBulkCreate = () => {
    const defaultDate = event?.start_date 
      ? format(parseISO(event.start_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    setBulkFormData({
      date: defaultDate,
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      breakBetween: 0,
      location: '',
    });
    setBulkDialogOpen(true);
  };

  const handleBulkCreate = async () => {
    if (!eventId || !bulkFormData.date || !bulkFormData.startTime || !bulkFormData.endTime) return;

    const baseDate = parseISO(bulkFormData.date);
    const [startHour, startMin] = bulkFormData.startTime.split(':').map(Number);
    const [endHour, endMin] = bulkFormData.endTime.split(':').map(Number);
    
    let currentStart = setDate(baseDate, { hours: startHour, minutes: startMin, seconds: 0 });
    const endLimit = setDate(baseDate, { hours: endHour, minutes: endMin, seconds: 0 });
    
    const slotsToCreate: { event_id: string; start_time: string; end_time: string; location?: string }[] = [];
    
    while (currentStart < endLimit) {
      const slotEnd = addMinutes(currentStart, bulkFormData.slotDuration);
      if (slotEnd > endLimit) break;
      
      slotsToCreate.push({
        event_id: eventId,
        start_time: currentStart.toISOString(),
        end_time: slotEnd.toISOString(),
        location: bulkFormData.location.trim() || undefined,
      });
      
      currentStart = addMinutes(slotEnd, bulkFormData.breakBetween);
    }
    
    if (slotsToCreate.length > 0) {
      await bulkCreateSlots.mutateAsync(slotsToCreate);
    }
    
    setBulkDialogOpen(false);
  };

  const formatSlotTime = (slot: MeetingSlot) => {
    const start = parseISO(slot.start_time);
    const end = parseISO(slot.end_time);
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to={`/admin/events/${eventId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Event
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold">Meetings Management</h1>
            <p className="text-muted-foreground">
              Manage meeting locations and time slots for {event?.title || 'this event'}
            </p>
          </div>
        </div>

        {/* Tabs for Spots and Slots */}
        <Tabs defaultValue="spots" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="spots" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Meeting Spots
            </TabsTrigger>
            <TabsTrigger value="slots" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Slots
            </TabsTrigger>
          </TabsList>

          {/* Meeting Spots Tab */}
          <TabsContent value="spots" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Meeting Locations</CardTitle>
                  <CardDescription>
                    Define tables, booths, or rooms where attendees can meet during the event
                  </CardDescription>
                </div>
                <Button onClick={handleOpenCreateSpot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Spot
                </Button>
              </CardHeader>
              <CardContent>
                {spotsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : spots?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No meeting spots defined yet</p>
                    <p className="text-sm">Add locations where attendees can meet</p>
                    <Button className="mt-4" onClick={handleOpenCreateSpot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Spot
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Capacity</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spots?.map((spot) => (
                        <TableRow key={spot.id}>
                          <TableCell className="font-medium">{spot.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {spot.location || '—'}
                          </TableCell>
                          <TableCell className="text-center">{spot.capacity}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={spot.is_active ? 'default' : 'secondary'}>
                              {spot.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleSpotActive(spot)}
                                title={spot.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {spot.is_active ? (
                                  <ToggleRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditSpot(spot)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteSpotItem(spot)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Slots Tab */}
          <TabsContent value="slots" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Meeting Time Slots</CardTitle>
                  <CardDescription>
                    Define available time windows when attendees can book meetings
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleOpenBulkCreate}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Generate Slots
                  </Button>
                  <Button onClick={handleOpenCreateSlot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : slots?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No time slots defined yet</p>
                    <p className="text-sm">Create individual slots or generate them in bulk</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button variant="outline" onClick={handleOpenBulkCreate}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Generate Slots
                      </Button>
                      <Button onClick={handleOpenCreateSlot}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots?.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium">
                            {formatSlotTime(slot)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {slot.location || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={slot.is_available ? 'default' : 'secondary'}>
                              {slot.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleSlotAvailable(slot)}
                                title={slot.is_available ? 'Mark Unavailable' : 'Mark Available'}
                              >
                                {slot.is_available ? (
                                  <ToggleRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditSlot(slot)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteSlotItem(slot)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Spot Create/Edit Dialog */}
      <Dialog open={spotDialogOpen} onOpenChange={setSpotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSpot ? 'Edit Meeting Spot' : 'Add Meeting Spot'}
            </DialogTitle>
            <DialogDescription>
              {editingSpot
                ? 'Update the meeting spot details'
                : 'Create a new physical location for attendee meetings'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spot-name">Name *</Label>
              <Input
                id="spot-name"
                placeholder="e.g., Table 1, Booth A, Meeting Room 1"
                value={spotFormData.name}
                onChange={(e) => setSpotFormData({ ...spotFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spot-location">Location Description</Label>
              <Input
                id="spot-location"
                placeholder="e.g., Near the main stage, Floor 2 corridor"
                value={spotFormData.location}
                onChange={(e) => setSpotFormData({ ...spotFormData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spot-capacity">Capacity</Label>
              <Input
                id="spot-capacity"
                type="number"
                min={1}
                max={10}
                value={spotFormData.capacity}
                onChange={(e) =>
                  setSpotFormData({ ...spotFormData, capacity: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of simultaneous meetings this spot can accommodate
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSpotDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSpot}
              disabled={!spotFormData.name.trim() || createSpot.isPending || updateSpot.isPending}
            >
              {createSpot.isPending || updateSpot.isPending
                ? 'Saving...'
                : editingSpot
                ? 'Save Changes'
                : 'Add Spot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Create/Edit Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
            </DialogTitle>
            <DialogDescription>
              {editingSlot
                ? 'Update the time slot details'
                : 'Create a new time window for meeting bookings'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Date *</Label>
              <Input
                id="slot-date"
                type="date"
                value={slotFormData.date}
                onChange={(e) => setSlotFormData({ ...slotFormData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot-start">Start Time *</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={slotFormData.startTime}
                  onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">End Time *</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={slotFormData.endTime}
                  onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-location">Location (optional)</Label>
              <Input
                id="slot-location"
                placeholder="e.g., Room A, Table 1"
                value={slotFormData.location}
                onChange={(e) => setSlotFormData({ ...slotFormData, location: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSlot}
              disabled={
                !slotFormData.date || 
                !slotFormData.startTime || 
                !slotFormData.endTime ||
                createSlot.isPending || 
                updateSlot.isPending
              }
            >
              {createSlot.isPending || updateSlot.isPending
                ? 'Saving...'
                : editingSlot
                ? 'Save Changes'
                : 'Add Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Slot Generator Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Time Slots</DialogTitle>
            <DialogDescription>
              Automatically create multiple time slots for a day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-date">Date *</Label>
              <Input
                id="bulk-date"
                type="date"
                value={bulkFormData.date}
                onChange={(e) => setBulkFormData({ ...bulkFormData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-start">Start Time</Label>
                <Input
                  id="bulk-start"
                  type="time"
                  value={bulkFormData.startTime}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-end">End Time</Label>
                <Input
                  id="bulk-end"
                  type="time"
                  value={bulkFormData.endTime}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-duration">Slot Duration</Label>
                <Select
                  value={String(bulkFormData.slotDuration)}
                  onValueChange={(v) => setBulkFormData({ ...bulkFormData, slotDuration: Number(v) })}
                >
                  <SelectTrigger id="bulk-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-break">Break Between</Label>
                <Select
                  value={String(bulkFormData.breakBetween)}
                  onValueChange={(v) => setBulkFormData({ ...bulkFormData, breakBetween: Number(v) })}
                >
                  <SelectTrigger id="bulk-break">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No break</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-location">Location (optional)</Label>
              <Input
                id="bulk-location"
                placeholder="Applies to all generated slots"
                value={bulkFormData.location}
                onChange={(e) => setBulkFormData({ ...bulkFormData, location: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={
                !bulkFormData.date || 
                !bulkFormData.startTime || 
                !bulkFormData.endTime ||
                bulkCreateSlots.isPending
              }
            >
              {bulkCreateSlots.isPending ? 'Generating...' : 'Generate Slots'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Spot Confirmation */}
      <AlertDialog open={!!deleteSpotItem} onOpenChange={() => setDeleteSpotItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Spot?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSpotItem?.name}"? This action cannot be undone.
              Any existing bookings for this spot will remain but won't have a location assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Slot Confirmation */}
      <AlertDialog open={!!deleteSlotItem} onOpenChange={() => setDeleteSlotItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time slot? This action cannot be undone.
              Any existing bookings for this slot will remain but won't have a time assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
