"""CPython tracing adapter. Executes user source in a fresh namespace per run."""
import sys
import io
import json
import math
import types
import time
import contextlib


def trace_python(source, stdin):
    started = time.monotonic()
    doc = dict(language='python', code=source, stdin=stdin, status='ok',
               options=dict(objects=False), problems=[], trace=[])
    namespace = {'__name__': '__main__'}
    output = io.StringIO()
    ids, retained, frame_ids = {}, [], {}
    next_id = 1
    ticks = 0
    last_frame = None

    class Limit(BaseException):
        pass

    def snapshot(frame, event, arg=None):
        nonlocal next_id
        heap = {}

        def encode(value, depth=0):
            nonlocal next_id
            kind = type(value)
            if value is None or kind in (str, bool):
                return value[:2000] if kind is str else value
            if kind is int:
                return value if abs(value) <= 9007199254740991 else ['LONG', str(value)]
            if kind is float:
                return value if math.isfinite(value) else ['SPECIAL_FLOAT', str(value)]
            if depth > 10 or len(heap) >= 300:
                doc['heapTruncated'] = True
                return '…'
            oid = id(value)
            if oid not in ids:
                ids[oid] = next_id
                next_id += 1
                retained.append(value)  # Prevent CPython id reuse during this run.
            ref = ids[oid]
            if str(ref) in heap:
                return ['REF', ref]
            heap[str(ref)] = ['OPAQUE', kind.__name__]
            if kind in (list, tuple, set, frozenset):
                items = list(value)
                encoded = [encode(x, depth + 1) for x in items[:100]]
                if len(items) > 100:
                    encoded.append('…')
                    doc['heapTruncated'] = True
                heap[str(ref)] = ['COLLECTION', kind.__name__, encoded]
            elif kind is dict:
                heap[str(ref)] = ['MAP', 'dict', [[encode(k, depth + 1), encode(v, depth + 1)]
                                                for k, v in list(value.items())[:100]]]
                if len(value) > 100:
                    doc['heapTruncated'] = True
            elif hasattr(kind, '__dict__'):
                # Read the instance dictionary without invoking a user property/repr.
                try:
                    attrs = object.__getattribute__(value, '__dict__')
                except (AttributeError, TypeError):
                    attrs = {}
                if type(attrs) is dict and attrs:
                    heap[str(ref)] = ['INSTANCE', kind.__name__,
                                      *[[str(k), encode(v, depth + 1)] for k, v in list(attrs.items())[:100]]]
            return ['REF', ref]

        def visible(values):
            return {k: encode(v) for k, v in list(values.items())[:200]
                    if not k.startswith('__') and not isinstance(v, (types.ModuleType, types.FunctionType, type))}

        chain = []
        current = frame
        while current:
            if current.f_code.co_filename == '<visualizer>':
                chain.append(current)
            current = current.f_back
        frames = []
        for current in reversed(chain):
            if current.f_code.co_name == '<module>':
                continue
            fid = id(current)
            if fid not in frame_ids:
                frame_ids[fid] = len(frame_ids) + 1
                retained.append(current)
            values = visible(current.f_locals)
            if current is frame and event == 'return':
                values['__return__'] = encode(arg)
            frames.append(dict(func_name=current.f_code.co_name, **{'class': ''},
                               frame_id=frame_ids[fid], line=max(1, current.f_lineno),
                               is_highlighted=current is frame, encoded_locals=values,
                               ordered_varnames=list(values),
                               unbound_locals=[name for name in current.f_code.co_varnames + current.f_code.co_cellvars
                                               if name not in current.f_locals and not name.startswith('__')]))
        globals_ = visible(namespace)
        mapped_event = {'line': 'step_line', 'opcode': 'step_line'}.get(event, event)
        step = dict(event=mapped_event, line=max(1, frame.f_lineno), stdout=output.getvalue()[:16000],
                    globals=globals_, ordered_globals=list(globals_), stack_to_render=frames, heap=heap)
        if frames:
            step['func_name'] = frames[-1]['func_name']
        if event == 'exception':
            step['exception_msg'] = arg[0].__name__ + ': ' + str(arg[1])[:2000]
        return step

    def tracer(frame, event, arg):
        nonlocal ticks, last_frame
        if frame.f_code.co_filename != '<visualizer>':
            return None
        last_frame = frame
        frame.f_trace_opcodes = True
        ticks += 1
        if ticks > 200000 or len(doc['trace']) >= 1000 or time.monotonic() - started > 8 or output.tell() > 16000:
            raise Limit()
        if event in ('call', 'line', 'return', 'exception'):
            doc['trace'].append(snapshot(frame, event, arg))
        return tracer

    try:
        compiled = compile(source, '<visualizer>', 'exec')
    except SyntaxError as error:
        doc['status'] = 'compile_error'
        doc['problems'] = [dict(line=error.lineno or 1, error=True, message=str(error))]
        return json.dumps(doc)
    old_stdin = sys.stdin
    try:
        sys.stdin = io.StringIO(stdin)
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            sys.settrace(tracer)
            try:
                exec(compiled, namespace)
            finally:
                sys.settrace(None)
    except Limit:
        doc['status'] = 'step_limit'
        if last_frame:
            step = snapshot(last_frame, 'instruction_limit_reached')
            step['exception_msg'] = '실행 단계·시간·출력 제한에 도달했습니다.'
            doc['trace'].append(step)
    except BaseException as error:
        doc['status'] = 'uncaught_exception'
        tb = error.__traceback__
        while tb:
            if tb.tb_frame.f_code.co_filename == '<visualizer>':
                last_frame = tb.tb_frame
            tb = tb.tb_next
        doc['message'] = type(error).__name__ + ': ' + str(error)[:2000]
        if last_frame:
            step = snapshot(last_frame, 'uncaught_exception')
            step['exception_msg'] = doc['message']
            doc['trace'].append(step)
    finally:
        sys.settrace(None)
        sys.stdin = old_stdin
    if doc['status'] == 'ok' and last_frame:
        step = snapshot(last_frame, 'return')
        step['stack_to_render'] = []
        step.pop('func_name', None)
        doc['trace'].append(step)
    doc['timing'] = dict(runNs=(time.monotonic() - started) * 1e9)
    return json.dumps(doc, ensure_ascii=True)
