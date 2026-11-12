import sys, ezdxf
from ezdxf import recover
for f in sys.argv[1:]:
    try:
        doc = ezdxf.readfile(f); print(f, 'strict readfile OK', doc.dxfversion)
    except Exception as e:
        print(f, 'strict readfile FAILED:', type(e).__name__, e)
    doc, aud = recover.readfile(f)
    print('  recover: fixes=%d errors=%d' % (len(aud.fixes), len(aud.errors)))
    for x in aud.fixes[:6]: print('   fix:', x.message)
    a = doc.audit(); print('  audit: fixes=%d errors=%d' % (len(a.fixes), len(a.errors)))
    from collections import Counter
    print('  entities', dict(Counter(e.dxftype() for e in doc.modelspace())), 'layers', len(doc.layers))
