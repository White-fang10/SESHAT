import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Shuffle, Grid, Move, RotateCcw } from 'lucide-react';
import { Note, Label, NoteAppearance } from '../types/note';
import { NoteCard } from './NoteCard';

interface FreeboardCanvasProps {
  notes: Note[];
  labels: Label[];
  isDarkMode: boolean;
  onUpdateNotePosition: (noteId: string, x: number, y: number, rotation?: number) => void;
  onScatterRandomSpots: () => void;
  onTidyGrid: () => void;
  onTogglePin: (id: string) => void;
  onToggleStar?: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onMoveToTrash: (id: string) => void;
  onRestoreFromTrash?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onOpenDesignStudio: (note: Note) => void;
  onOpenShareModal: (note: Note) => void;
  onToggleChecklistItem: (noteId: string, itemId: string) => void;
  onEditNote: (note: Note) => void;
  onOpenCreatorDetails?: () => void;
  isTrashView?: boolean;
}

export const FreeboardCanvas: React.FC<FreeboardCanvasProps> = ({
  notes,
  labels,
  isDarkMode,
  onUpdateNotePosition,
  onScatterRandomSpots,
  onTidyGrid,
  onTogglePin,
  onToggleStar,
  onToggleArchive,
  onMoveToTrash,
  onRestoreFromTrash,
  onPermanentDelete,
  onDuplicateNote,
  onOpenDesignStudio,
  onOpenShareModal,
  onToggleChecklistItem,
  onEditNote,
  onOpenCreatorDetails,
  isTrashView = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active dragging card state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentCoords, setCurrentCoords] = useState<{ [id: string]: { x: number; y: number; rotation: number } }>({});

  // Compute organic default spots for notes that don't have saved position
  useEffect(() => {
    setCurrentCoords((prev) => {
      const next = { ...prev };
      const cardWidth = 300;
      const cardHeight = 260;
      const cols = 4;

      notes.forEach((note, index) => {
        if (!next[note.id]) {
          if (note.position && typeof note.position.x === 'number' && typeof note.position.y === 'number') {
            next[note.id] = {
              x: note.position.x,
              y: note.position.y,
              rotation: note.position.rotation ?? (((index * 13) % 7) - 3),
            };
          } else {
            // Generate organic staggered spot
            const col = index % cols;
            const row = Math.floor(index / cols);
            const jitterX = ((index * 37) % 40) - 20;
            const jitterY = ((index * 53) % 35) - 17;
            const rot = ((index * 17) % 7) - 3; // -3 to +3 deg subtle playful tilt
            next[note.id] = {
              x: Math.max(20, col * (cardWidth + 24) + 24 + jitterX),
              y: Math.max(20, row * (cardHeight + 24) + 24 + jitterY),
              rotation: rot,
            };
          }
        }
      });
      return next;
    });
  }, [notes]);

  // Handle pointer down on card header / grip
  const handlePointerDown = (e: React.PointerEvent, noteId: string) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0) return;

    // Don't drag if clicking buttons, inputs, links, or dropdowns
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.closest('.dropdown-menu')
    ) {
      return;
    }

    const notePos = currentCoords[noteId] || { x: 20, y: 20, rotation: 0 };
    setActiveDragId(noteId);
    setDragOffset({
      x: e.clientX - notePos.x,
      y: e.clientY - notePos.y,
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragId) return;

    const newX = Math.max(10, e.clientX - dragOffset.x);
    const newY = Math.max(10, e.clientY - dragOffset.y);

    setCurrentCoords((prev) => ({
      ...prev,
      [activeDragId]: {
        ...prev[activeDragId],
        x: newX,
        y: newY,
      },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeDragId) return;

    const finalPos = currentCoords[activeDragId];
    if (finalPos) {
      onUpdateNotePosition(activeDragId, Math.round(finalPos.x), Math.round(finalPos.y), finalPos.rotation);
    }

    setActiveDragId(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Compute maximum canvas height based on furthest note position
  const canvasHeight = useMemo(() => {
    let maxY = 700;
    Object.values(currentCoords).forEach((c) => {
      if (c.y + 400 > maxY) maxY = c.y + 400;
    });
    return maxY;
  }, [currentCoords]);

  return (
    <div className="w-full space-y-3">
      {/* Freeboard Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs select-none">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Move className="w-4 h-4 text-[#F59E0B]" />
          <span>Freeboard Pinboard</span>
          <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
            (Drag notes freely to any random spot)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onScatterRandomSpots}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40 transition cursor-pointer"
            title="Randomize spots for all notes"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Scatter Spots</span>
          </button>

          <button
            type="button"
            onClick={onTidyGrid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Align notes neatly on the board"
          >
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <span>Tidy Board</span>
          </button>
        </div>
      </div>

      {/* Interactive Freeform Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto overflow-y-hidden shadow-inner select-none transition-all duration-200"
        style={{
          minHeight: `${canvasHeight}px`,
          backgroundColor: isDarkMode ? '#0d131f' : '#fdfbf7',
          backgroundImage: isDarkMode
            ? 'radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)'
            : 'radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      >
        {notes.map((note) => {
          const coords = currentCoords[note.id] || { x: 20, y: 20, rotation: 0 };
          const isDraggingThis = activeDragId === note.id;

          return (
            <div
              key={note.id}
              onPointerDown={(e) => handlePointerDown(e, note.id)}
              className={`absolute transition-shadow duration-150 touch-none ${
                isDraggingThis ? 'z-40 cursor-grabbing shadow-2xl scale-[1.02]' : 'z-10 cursor-grab hover:z-20'
              }`}
              style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                width: '300px',
                transform: `rotate(${isDraggingThis ? 0 : coords.rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <NoteCard
                note={note}
                labels={labels}
                isDarkMode={isDarkMode}
                isDraggable={true}
                isDragging={isDraggingThis}
                onTogglePin={onTogglePin}
                onToggleStar={onToggleStar}
                onToggleArchive={onToggleArchive}
                onMoveToTrash={onMoveToTrash}
                onRestoreFromTrash={onRestoreFromTrash}
                onPermanentDelete={onPermanentDelete}
                onDuplicateNote={onDuplicateNote}
                onOpenDesignStudio={onOpenDesignStudio}
                onOpenShareModal={onOpenShareModal}
                onToggleChecklistItem={onToggleChecklistItem}
                onEditNote={onEditNote}
                onOpenCreatorDetails={onOpenCreatorDetails}
                isTrashView={isTrashView}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
