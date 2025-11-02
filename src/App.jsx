import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Calendar, X, ChevronDown, Check, Pin } from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(20);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddView, setShowAddView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [swipedCard, setSwipedCard] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState({ time: '', date: '', dayOffset: 0 });
  
  const timelineRefs = useRef({});
  const cardRefs = useRef({});
  const swipeStartX = useRef(0);

  const [currentView, setCurrentView] = useState('Work View');
  const [views, setViews] = useState(['Work View', 'Travel View', 'Family View']);
  const [mainZoneId, setMainZoneId] = useState(null);
  
  const [timeZones, setTimeZones] = useState([]);

  const availableCities = [
    { city: 'Shanghai', timezone: 'Asia/Shanghai', offset: 8 },
    { city: 'London', timezone: 'Europe/London', offset: 0 },
    { city: 'Tokyo', timezone: 'Asia/Tokyo', offset: 9 },
    { city: 'New York', timezone: 'America/New_York', offset: -5 },
    { city: 'Paris', timezone: 'Europe/Paris', offset: 1 },
    { city: 'Sydney', timezone: 'Australia/Sydney', offset: 11 },
    { city: 'Dubai', timezone: 'Asia/Dubai', offset: 4 },
    { city: 'Singapore', timezone: 'Asia/Singapore', offset: 8 },
    { city: 'Los Angeles', timezone: 'America/Los_Angeles', offset: -8 },
    { city: 'Mumbai', timezone: 'Asia/Kolkata', offset: 5.5 }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeForZone = (targetOffset, baseOffset, hour, minute) => {
    const diffHours = targetOffset - baseOffset;
    let newHour = hour + diffHours;
    let newMinute = minute;
    
    let dayOffset = 0;
    if (newHour >= 24) {
      dayOffset = Math.floor(newHour / 24);
      newHour = newHour % 24;
    } else if (newHour < 0) {
      dayOffset = Math.ceil(newHour / 24) - 1;
      newHour = ((newHour % 24) + 24) % 24;
    }
    
    return { hour: newHour, minute: newMinute, dayOffset };
  };

  const getGradient = (hour) => {
    if (hour >= 6 && hour < 12) return 'from-orange-400 via-pink-400 to-purple-500';
    if (hour >= 12 && hour < 18) return 'from-amber-300 via-orange-400 to-pink-400';
    if (hour >= 18 && hour < 22) return 'from-purple-500 via-blue-600 to-indigo-800';
    return 'from-indigo-900 via-blue-900 to-slate-900';
  };

  const handleTimelineDrag = (e, zoneId) => {
    const ref = timelineRefs.current[zoneId];
    if (!ref) return;
    
    const rect = ref.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    const totalMinutes = percentage * 24 * 60;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.floor(roundedMinutes / 60) % 24;
    const minute = roundedMinutes % 60;
    
    setSelectedHour(hour);
    setSelectedMinute(minute);
    
    const zone = filteredZones.find(z => z.id === zoneId);
    const mainZone = getMainZone();
    const { hour: displayHour, minute: displayMinute, dayOffset } = 
      getTimeForZone(zone.offset, mainZone.offset, hour, minute);
    
    setTooltipData({
      time: formatTime(displayHour, displayMinute),
      date: 'Tue, Jan 18',
      dayOffset
    });
    setTooltipPosition({ x: e.clientX, y: rect.top - 10 });
    setTooltipVisible(true);
  };

  const handleTouchMove = (e, zoneId) => {
    if (!isDragging || draggedCard !== zoneId) return;
    
    const ref = timelineRefs.current[zoneId];
    if (!ref) return;
    
    const touch = e.touches[0];
    const rect = ref.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    const totalMinutes = percentage * 24 * 60;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.floor(roundedMinutes / 60) % 24;
    const minute = roundedMinutes % 60;
    
    setSelectedHour(hour);
    setSelectedMinute(minute);
    
    const zone = filteredZones.find(z => z.id === zoneId);
    const mainZone = getMainZone();
    const { hour: displayHour, minute: displayMinute, dayOffset } = 
      getTimeForZone(zone.offset, mainZone.offset, hour, minute);
    
    setTooltipData({
      time: formatTime(displayHour, displayMinute),
      date: 'Tue, Jan 18',
      dayOffset
    });
    setTooltipPosition({ x: touch.clientX, y: rect.top - 10 });
    setTooltipVisible(true);
  };

  const handleSwipeStart = (e, zoneId) => {
    if (expandedCard === zoneId) return;
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleSwipeMove = (e, zoneId) => {
    if (expandedCard === zoneId) return;
    const currentX = e.touches[0].clientX;
    const diff = swipeStartX.current - currentX;
    
    if (diff > 0 && diff < 200) {
      setSwipedCard(zoneId);
      setSwipeOffset(diff);
    }
  };

  const handleSwipeEnd = () => {
    if (swipeOffset < 80) {
      setSwipedCard(null);
      setSwipeOffset(0);
    }
  };

  const resetToCurrentTime = () => {
    const now = new Date();
    setSelectedHour(now.getHours());
    setSelectedMinute(Math.floor(now.getMinutes() / 15) * 15);
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const addTimeZone = (city) => {
    const newZone = {
      id: Date.now(),
      ...city,
      view: currentView
    };
    setTimeZones([...timeZones, newZone]);
    if (filteredZones.length === 0) {
      setMainZoneId(newZone.id);
    }
    setShowAddZone(false);
  };

  const removeTimeZone = (id) => {
    setTimeZones(timeZones.filter(z => z.id !== id));
    if (expandedCard === id) setExpandedCard(null);
    if (mainZoneId === id) {
      const remaining = timeZones.filter(z => z.id !== id && z.view === currentView);
      setMainZoneId(remaining.length > 0 ? remaining[0].id : null);
    }
    setSwipedCard(null);
    setSwipeOffset(0);
  };

  const pinAsMain = (id) => {
    setMainZoneId(id);
    setSwipedCard(null);
    setSwipeOffset(0);
  };

  const addNewView = () => {
    if (newViewName.trim() && !views.includes(newViewName.trim())) {
      setViews([...views, newViewName.trim()]);
      setCurrentView(newViewName.trim());
      setNewViewName('');
      setShowAddView(false);
      setShowViewDropdown(false);
    }
  };

  const getMainZone = () => {
    const filtered = filteredZones;
    if (mainZoneId) {
      const main = filtered.find(z => z.id === mainZoneId);
      if (main) return main;
    }
    return filtered[0];
  };

  const filteredZones = timeZones.filter(z => z.view === currentView);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white font-sans pb-32">
      {tooltipVisible && (
        <div 
          className="fixed z-50 bg-slate-800 px-3 py-2 rounded-lg shadow-2xl border border-white/20 pointer-events-none"
          style={{ 
            left: tooltipPosition.x, 
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-sm font-semibold">{tooltipData.time}</div>
          <div className="text-xs text-gray-400">
            {tooltipData.date}
            {tooltipData.dayOffset !== 0 && (
              <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                {tooltipData.dayOffset > 0 ? '+1' : '-1'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="px-6 py-4 flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowViewDropdown(!showViewDropdown)}
            className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition"
          >
            <span className="text-orange-400 text-xl font-semibold">{currentView.split(' ')[0]}</span>
            <span className="text-purple-400 text-xl font-semibold">{currentView.split(' ')[1] || ''}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showViewDropdown && (
            <div className="absolute top-full mt-2 left-0 bg-slate-800 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] z-50 border border-white/10">
              {views.map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    setCurrentView(view);
                    setShowViewDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition ${
                    currentView === view ? 'bg-slate-700 text-purple-400' : ''
                  }`}
                >
                  {view}
                </button>
              ))}
              
              <button
                onClick={() => {
                  setShowAddView(true);
                  setShowViewDropdown(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 transition text-purple-400 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New View
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowAddZone(true)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {filteredZones.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-white/40" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Time Zones Yet</h2>
          <p className="text-gray-400 text-center mb-8 max-w-sm">
            Add your first time zone to start tracking times across the world
          </p>
          <button
            onClick={() => setShowAddZone(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-indigo-600 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add a Time Zone
          </button>
        </div>
      ) : (
        <div className="px-6 space-y-4">
          {filteredZones.map((zone) => {
            const isExpanded = expandedCard === zone.id;
            const isSwiped = swipedCard === zone.id;
            const mainZone = getMainZone();
            const isMain = zone.id === mainZone.id;
            
            const { hour: localHour, minute: localMinute, dayOffset } = 
              isMain
                ? { hour: selectedHour, minute: selectedMinute, dayOffset: 0 }
                : getTimeForZone(zone.offset, mainZone.offset, selectedHour, selectedMinute);
            
            return (
              <div key={zone.id} className="relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4">
                  <button
                    onClick={() => removeTimeZone(zone.id)}
                    className="w-16 h-16 rounded-2xl bg-red-500 flex flex-col items-center justify-center gap-1"
                  >
                    <X className="w-6 h-6" />
                    <span className="text-xs font-semibold">Delete</span>
                  </button>
                  {!isMain && (
                    <button
                      onClick={() => pinAsMain(zone.id)}
                      className="w-20 h-16 rounded-2xl bg-indigo-500 flex flex-col items-center justify-center gap-1"
                    >
                      <Pin className="w-6 h-6" />
                      <span className="text-xs font-semibold">Pin Main</span>
                    </button>
                  )}
                </div>

                <div 
                  ref={el => cardRefs.current[zone.id] = el}
                  onClick={() => {
                    if (!isSwiped && !isDragging) {
                      setExpandedCard(isExpanded ? null : zone.id);
                    }
                  }}
                  onTouchStart={(e) => handleSwipeStart(e, zone.id)}
                  onTouchMove={(e) => handleSwipeMove(e, zone.id)}
                  onTouchEnd={handleSwipeEnd}
                  className={`bg-gradient-to-r ${getGradient(localHour)} rounded-3xl shadow-2xl transition-all duration-300 cursor-pointer relative ${
                    isExpanded ? 'p-6' : 'p-5'
                  }`}
                  style={{
                    transform: isSwiped ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                    transition: isSwiped ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {isMain ? (
                        <Pin className="w-5 h-5 text-white/80" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/60"></div>
                      )}
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${isExpanded ? 'text-4xl' : 'text-3xl'}`}>
                          {zone.city}
                        </h3>
                        <p className="text-white/80">
                          {isMain ? 'Your Location' : 
                            zone.offset > mainZone.offset 
                              ? `${Math.abs(zone.offset - mainZone.offset)} hrs Ahead`
                              : zone.offset < mainZone.offset
                              ? `${Math.abs(zone.offset - mainZone.offset)} hrs Behind`
                              : 'Same time'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold mb-1 ${isExpanded ? 'text-5xl' : 'text-4xl'}`}>
                        {formatTime(localHour, localMinute)}
                      </div>
                      <p className="text-white/80">
                        Tue, Jan 18
                        {dayOffset !== 0 && (
                          <span className="ml-2 text-sm bg-white/20 px-2 py-0.5 rounded">
                            {dayOffset > 0 ? '+1' : '-1'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div 
                      ref={el => timelineRefs.current[zone.id] = el}
                      className="mt-6 relative h-20 cursor-pointer select-none"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDragging(true);
                        setDraggedCard(zone.id);
                        handleTimelineDrag(e, zone.id);
                      }}
                      onMouseMove={(e) => isDragging && draggedCard === zone.id && handleTimelineDrag(e, zone.id)}
                      onMouseUp={() => {
                        setIsDragging(false);
                        setDraggedCard(null);
                        setTooltipVisible(false);
                      }}
                      onMouseLeave={() => {
                        setIsDragging(false);
                        setDraggedCard(null);
                        setTooltipVisible(false);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setIsDragging(true);
                        setDraggedCard(zone.id);
                      }}
                      onTouchMove={(e) => handleTouchMove(e, zone.id)}
                      onTouchEnd={() => {
                        setIsDragging(false);
                        setDraggedCard(null);
                        setTooltipVisible(false);
                      }}
                    >
                      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs">
                        {Array.from({ length: 25 }, (_, i) => i).map((h) => (
                          <div key={h} className="flex flex-col items-center" style={{ flex: 1 }}>
                            <div className={`w-px bg-white/40 ${h % 3 === 0 ? 'h-6' : 'h-3'}`}></div>
                            {h % 3 === 0 && <span className="text-white/80 mt-1">{h}</span>}
                          </div>
                        ))}
                      </div>

                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg z-10"
                        style={{ left: `${((selectedHour + selectedMinute / 60) / 24) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredZones.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-8">
          <button 
            onClick={resetToCurrentTime}
            className="flex-1 bg-indigo-900/60 backdrop-blur-xl rounded-full py-4 px-6 flex items-center justify-center gap-3 hover:bg-indigo-800/60 transition shadow-xl border border-white/10"
          >
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Current Time</span>
          </button>
          <button className="flex-1 bg-indigo-600/80 backdrop-blur-xl rounded-full py-4 px-6 flex items-center justify-center gap-3 hover:bg-indigo-500/80 transition shadow-xl">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add to Calendar</span>
          </button>
        </div>
      )}

      {showAddZone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Add Time Zone</h3>
              <button 
                onClick={() => setShowAddZone(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 mb-4">Select a city to add to {currentView}</p>
            <div className="space-y-2 overflow-y-auto">
              {availableCities
                .filter(city => !filteredZones.some(z => z.city === city.city))
                .map((city) => (
                  <button 
                    key={city.city}
                    onClick={() => addTimeZone(city)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-700 transition flex justify-between items-center"
                  >
                    <span>{city.city}</span>
                    <span className="text-sm text-gray-400">UTC {city.offset >= 0 ? '+' : ''}{city.offset}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {showAddView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Add New View</h3>
              <button 
                onClick={() => {
                  setShowAddView(false);
                  setNewViewName('');
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 mb-4">Create a new view to organize your time zones</p>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNewView()}
              placeholder="e.g., Family, Clients, Travel..."
              className="w-full bg-slate-700 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddView(false);
                  setNewViewName('');
                }}
                className="flex-1 bg-slate-700 rounded-xl py-3 font-semibold hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={addNewView}
                disabled={!newViewName.trim() || views.includes(newViewName.trim())}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl py-3 font-semibold hover:from-purple-600 hover:to-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create View
              </button>
            </div>
            {newViewName.trim() && views.includes(newViewName.trim()) && (
              <p className="text-red-400 text-sm mt-2">This view name already exists</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;