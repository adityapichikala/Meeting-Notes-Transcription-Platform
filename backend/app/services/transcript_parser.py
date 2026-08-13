import json
import re
from abc import ABC, abstractmethod
from typing import Dict, List, Optional

from app.schemas.transcript import TranscriptSegmentCreate


class BaseParser(ABC):
    @abstractmethod
    def parse(self, content: str) -> List[TranscriptSegmentCreate]:
        pass

class JsonParser(BaseParser):
    def parse(self, content: str) -> List[TranscriptSegmentCreate]:
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")
            
        if not isinstance(data, list):
            raise ValueError("JSON transcript must be a list of segments")
            
        segments = []
        for i, item in enumerate(data):
            # Try to handle various common JSON formats for transcripts
            start_ms = item.get("start_ms") or item.get("start") or 0
            end_ms = item.get("end_ms") or item.get("end") or 0
            
            # If timestamps are in seconds (floats), convert to ms
            if isinstance(start_ms, float):
                start_ms = int(start_ms * 1000)
            if isinstance(end_ms, float):
                end_ms = int(end_ms * 1000)
                
            text = item.get("text", "")
            speaker = item.get("speaker") or item.get("speaker_label")
            
            segments.append(TranscriptSegmentCreate(
                sequence_index=i,
                start_ms=int(start_ms),
                end_ms=int(end_ms),
                text=str(text).strip(),
                speaker_label=str(speaker).strip() if speaker else None
            ))
        return segments

class VttParser(BaseParser):
    def parse(self, content: str) -> List[TranscriptSegmentCreate]:
        lines = content.strip().split('\n')
        segments = []
        
        # WEBVTT format check could be added here
        
        current_segment = {}
        seq_idx = 0
        
        # Regex for VTT timestamps: 00:00:01.000 --> 00:00:02.000 or 00:01.000 --> 00:02.000
        time_pattern = re.compile(r'(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})')
        # Regex for Speaker: <v Speaker Name> text
        speaker_pattern = re.compile(r'^<v\s+([^>]+)>(.*)$')
        
        def parse_time_to_ms(h, m, s, ms):
            hours = int(h[:-1]) if h else 0
            minutes = int(m)
            seconds = int(s)
            milliseconds = int(ms)
            return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds

        for line in lines:
            line = line.strip()
            if not line or line == "WEBVTT" or line.isdigit():
                continue
                
            time_match = time_pattern.search(line)
            if time_match:
                if current_segment and 'text' in current_segment:
                    segments.append(self._create_segment(current_segment, seq_idx))
                    seq_idx += 1
                    
                start_ms = parse_time_to_ms(time_match.group(1), time_match.group(2), time_match.group(3), time_match.group(4))
                end_ms = parse_time_to_ms(time_match.group(5), time_match.group(6), time_match.group(7), time_match.group(8))
                
                current_segment = {
                    'start_ms': start_ms,
                    'end_ms': end_ms,
                    'text': [],
                    'speaker': None
                }
            elif current_segment:
                # Check for speaker in the text line
                speaker_match = speaker_pattern.match(line)
                if speaker_match:
                    current_segment['speaker'] = speaker_match.group(1).strip()
                    current_segment['text'].append(speaker_match.group(2).strip())
                else:
                    # Generic format: "Speaker: Text" or just "Text"
                    parts = line.split(': ', 1)
                    if len(parts) == 2 and not current_segment['speaker']:
                        current_segment['speaker'] = parts[0].strip()
                        current_segment['text'].append(parts[1].strip())
                    else:
                        current_segment['text'].append(line)
                        
        if current_segment and 'text' in current_segment:
            segments.append(self._create_segment(current_segment, seq_idx))
            
        return segments
        
    def _create_segment(self, data: Dict, idx: int) -> TranscriptSegmentCreate:
        return TranscriptSegmentCreate(
            sequence_index=idx,
            start_ms=data['start_ms'],
            end_ms=data['end_ms'],
            text=" ".join(data['text']).strip(),
            speaker_label=data['speaker']
        )

class TxtParser(BaseParser):
    def parse(self, content: str) -> List[TranscriptSegmentCreate]:
        lines = content.strip().split('\n')
        segments = []
        seq_idx = 0
        current_ms = 0
        
        # Regex for [MM:SS] or [HH:MM:SS] format
        time_pattern = re.compile(r'^\[(?:(\d{2}):)?(\d{2}):(\d{2})\]\s*(.*)$')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            time_match = time_pattern.match(line)
            text_part = line
            
            if time_match:
                h, m, s = time_match.group(1), time_match.group(2), time_match.group(3)
                hours = int(h) if h else 0
                minutes = int(m)
                seconds = int(s)
                current_ms = (hours * 3600000) + (minutes * 60000) + (seconds * 1000)
                text_part = time_match.group(4).strip()
            
            speaker_label = None
            if ": " in text_part:
                parts = text_part.split(': ', 1)
                speaker_label = parts[0].strip()
                text_part = parts[1].strip()
                
            # Estimated duration based on text length (roughly 120ms per char)
            end_ms = current_ms + max(1000, len(text_part) * 120)
                
            segments.append(TranscriptSegmentCreate(
                sequence_index=seq_idx,
                start_ms=current_ms,
                end_ms=end_ms,
                text=text_part,
                speaker_label=speaker_label
            ))
            
            # Update current_ms for the next segment if timestamps are missing
            current_ms = end_ms
            seq_idx += 1
            
        return segments

def parse_transcript(content: str, file_format: str) -> List[TranscriptSegmentCreate]:
    parsers = {
        'json': JsonParser(),
        'vtt': VttParser(),
        'txt': TxtParser()
    }
    
    fmt = file_format.lower().lstrip('.')
    parser = parsers.get(fmt)
    if not parser:
        raise ValueError(f"Unsupported transcript format: {file_format}")
        
    return parser.parse(content)
