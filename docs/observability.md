# OTLP / observability exporters

In-process OTLP/JSON-shaped spans for handoff tracing.

```python
from a2aconnect import MemorySpanExporter, OtlpJsonExporter

spans = MemorySpanExporter()
root = spans.start_span("a2aconnect.handoff", attributes={"peer.to": "worker"})
spans.end_span(root, status="OK")

exporter = OtlpJsonExporter(endpoint=None)  # or OTLP HTTP URL
exporter.export(spans)
```

Demo: `python demos/next_stack.py`
