# Compare geometry (per layer) of two DXF files regardless of version / polyline type.
import sys, ezdxf
def geo(f):
    d=ezdxf.readfile(f); out=[]
    for e in d.modelspace():
        t=e.dxftype(); L=e.dxf.layer
        if t=='LINE': out.append((L,'L',tuple(round(v,3) for v in (e.dxf.start.x,e.dxf.start.y,e.dxf.end.x,e.dxf.end.y))))
        elif t=='CIRCLE': out.append((L,'C',tuple(round(v,3) for v in (e.dxf.center.x,e.dxf.center.y,e.dxf.radius))))
        elif t in('LWPOLYLINE','POLYLINE'):
            pts=[tuple(round(c,3) for c in p[:2]) for p in ([q[:2] for q in e.get_points("xy")] if t=="LWPOLYLINE" else [(v.dxf.location.x,v.dxf.location.y) for v in e.vertices])]
            out.append((L,'P',tuple(pts),e.is_closed))
        elif t=='TEXT': out.append((L,'T',e.dxf.text))
    return sorted(out)
a,b=geo(sys.argv[1]),geo(sys.argv[2]); print('entities',len(a),len(b),'identical geometry' if a==b else 'DIFFERENT')
