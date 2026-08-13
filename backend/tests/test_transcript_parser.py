import pytest
from app.services.transcript_parser import parse_transcript, JsonParser, VttParser, TxtParser

def test_json_parser():
    content = """
    [
        {"speaker": "Alice", "start_ms": 0, "end_ms": 1000, "text": "Hello world"},
        {"speaker": "Bob", "start_ms": 1000, "end_ms": 2000, "text": "Hi Alice"}
    ]
    """
    segments = parse_transcript(content, "json")
    assert len(segments) == 2
    assert segments[0].speaker_label == "Alice"
    assert segments[0].text == "Hello world"
    assert segments[0].start_ms == 0
    assert segments[1].speaker_label == "Bob"

def test_json_parser_floats():
    content = """
    [
        {"speaker": "Alice", "start_ms": 0.5, "end_ms": 1.5, "text": "Hello world"}
    ]
    """
    segments = parse_transcript(content, "json")
    assert segments[0].start_ms == 500
    assert segments[0].end_ms == 1500

def test_vtt_parser():
    content = """WEBVTT

00:00:01.000 --> 00:00:02.500
<v Alice>Hello world

00:00:02.500 --> 00:00:04.000
<v Bob>Hi Alice
How are you?
"""
    segments = parse_transcript(content, "vtt")
    assert len(segments) == 2
    assert segments[0].start_ms == 1000
    assert segments[0].end_ms == 2500
    assert segments[0].speaker_label == "Alice"
    assert segments[0].text == "Hello world"
    
    assert segments[1].speaker_label == "Bob"
    assert segments[1].text == "Hi Alice How are you?"

def test_txt_parser():
    content = """
[00:00:01] Alice: Hello world
[00:02] Bob: Hi Alice
    """
    segments = parse_transcript(content, "txt")
    assert len(segments) == 2
    assert segments[0].start_ms == 1000 # 1 sec
    assert segments[0].speaker_label == "Alice"
    assert segments[0].text == "Hello world"
    
    assert segments[1].start_ms == 2000 # 2 sec
    assert segments[1].speaker_label == "Bob"
    assert segments[1].text == "Hi Alice"
