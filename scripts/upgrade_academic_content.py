import json
from pathlib import Path

path = Path('content/nubia-content.json')
data = json.loads(path.read_text(encoding='utf-8'))
data['version'] = '1.0-academic-editorial'
data['academic_framework'] = {
    'edition': 'Nubia Odyssey Academic Edition 1.0',
    'editorial_standard': 'كل ادعاء تاريخي يُعرض مع نوع الدليل، حالة المراجعة، وروابط المصادر التي بُني عليها. لا تُحوَّل الذاكرة الشفوية إلى حقيقة أثرية، ولا يُقدَّم الاحتمال بوصفه يقينًا.',
    'evidence_levels': [
        {'key': 'archaeological', 'label': 'دليل أثري / مادي', 'description': 'موقع أو طبقة أو نقش أو مادة قابلة للفحص الأثري.', 'review': 'قراءة مقارنة للمصدر الأثري أو المؤسسي.'},
        {'key': 'historical', 'label': 'مصدر تاريخي / مؤسسي', 'description': 'نص تاريخي أو مؤسسة علمية أو سجل تراث عالمي.', 'review': 'فحص جهة النشر وسياق النص وحدوده.'},
        {'key': 'oral', 'label': 'ذاكرة شفوية / مجتمع حي', 'description': 'شهادة أو رواية مجتمعية تُحفظ مع نسبتها وسياقها.', 'review': 'مراجعة أصحاب الذاكرة وموافقتهم قبل التثبيت.'},
        {'key': 'review', 'label': 'فجوة بحثية / قيد المراجعة', 'description': 'معلومة تحتاج مصدرًا أوليًا أو مراجعة محلية قبل اعتمادها.', 'review': 'لا تُستخدم كحقيقة نهائية.'}
    ],
    'editorial_protocol': [
        'الفصل بين المادة الأثرية والتفسير التاريخي والذاكرة الحية.',
        'إظهار النطاق الزمني التقريبي وعدم إخفاء الخلافات العلمية.',
        'ربط كل فصل بمصادر قابلة للفتح، مع ذكر نوع المؤسسة أو المشروع.',
        'عدم نشر قائمة شاملة للقرى دون سجل محلي أو موافقة مجتمعية موثقة.',
        'فتح قناة تصحيح ومراجعة بدل تقديم المتحف كسلطة نهائية.'
    ],
    'review_status': 'نسخة تحريرية موثقة أوليًا — تحتاج مراجعة أكاديمية ومجتمعية قبل اعتمادها كمصدر رسمي.'
}
for source in data.get('sources', []):
    roles = {
        's1': ('مرجع تمهيدي زمني', 'جامعة شيكاغو / ISAC', 'سياق عام لتاريخ النوبة القديمة ومواقعها.'),
        's2': ('مقال متحفي تحليلي', 'The Metropolitan Museum of Art', 'عرض تركيبي مع تنبيه إلى حدود السرد المتحفي.'),
        's3': ('سجل تراث عالمي', 'UNESCO World Heritage', 'توثيق حملة إنقاذ المعالم النوبية ومواقعها.'),
        's4': ('سجل تراث عالمي', 'UNESCO World Heritage', 'توثيق منظومة مروي ومراكز كوش.'),
        's5': ('كتاب أكاديمي مفتوح', 'Open Book Publishers', 'دراسة الممالك المسيحية والوثائق العربية في النوبة.'),
        's6': ('خبر بعثة جامعية', 'University of Warsaw', 'دليل حديث على أعمال التنقيب في دنقلا القديمة.'),
        's7': ('مشروع جامعي للذاكرة', 'University of Michigan', 'سرديات التهجير والذاكرة الشفوية مع وسم طبيعتها.'),
    }
    label, institution, use = roles.get(source.get('id'), ('مصدر مؤسسي', '', ''))
    source.update({'role': label, 'institution': institution, 'editorial_use': use})
for index, chapter in enumerate(data.get('periods', []), 1):
    chapter['chapter_id'] = f'NB-{index:02d}'
    chapter['review_state'] = 'مراجع أوليًا'
    chapter['source_ids'] = [next((s['id'] for s in data['sources'] if s['url'] == url), None) for url in chapter.get('sources', [])]
    chapter['source_ids'] = [x for x in chapter['source_ids'] if x]
    chapter['claim_note'] = 'الملخص تركيب تحريري؛ راجع الوقائع والمصادر قبل الاقتباس الأكاديمي.'
for region in data.get('atlas', []):
    for place in region.get('places', []):
        place.setdefault('evidence', 'archaeological' if 'أثري' in place.get('kind', '') or 'موقع' in place.get('kind', '') else 'review')
        place.setdefault('review_state', 'يحتاج بطاقة جغرافية ومصدرًا أوليًا مستقلًا' if 'جزئي' in place.get('status', '') or 'يحتاج' in place.get('note', '') else 'مراجع أوليًا')
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('academic content upgraded:', len(data['periods']), 'chapters;', len(data['sources']), 'sources')
