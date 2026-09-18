// cuplet core types — lightweight, serializable, no heavy deps
export type TrackType = 'video' | 'audio' | 'image' | 'text' | 'caption';

export interface ClipProps {
  src?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  background?: string;
  x?: number; // 0..1 relative
  y?: number;
  width?: number; // 0..1
  opacity?: number;
  volume?: number; // 0..1
  filter?: string; // CSS filter string e.g. "sepia(.6) contrast(1.1)"
  fit?: 'cover' | 'contain' | 'fill';
}

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  /** start in seconds */
  s: number;
  /** end in seconds */
  e: number;
  /** media offset in seconds */
  offset?: number;
  props: ClipProps;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  muted?: boolean;
  locked?: boolean;
}

export interface ProjectProps {
  width: number;
  height: number;
  fps: number;
  background?: string;
  duration?: number;
}

export interface Project {
  properties: ProjectProps;
  tracks: Track[];
  clips: Clip[];
}

export interface CaptionCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export const DEFAULT_PROJECT: Project = {
  properties: { width: 720, height: 1280, fps: 30, background: '#000000', duration: 10 },
  tracks: [
    { id: 'v1', type: 'video', name: 'Video' },
    { id: 't1', type: 'text', name: 'Text' },
    { id: 'c1', type: 'caption', name: 'Captions' },
  ],
  clips: [
    {
      id: 'txt-hello',
      trackId: 't1',
      type: 'text',
      s: 0,
      e: 4,
      props: { text: 'Welcome to Cuplet', fontSize: 56, fill: '#ffffff', x: 0.5, y: 0.42 },
    },
  ],
};
