"""Validate admin-defined enquiry fields before saving public settings."""
def validate_questions(questions):
    if not isinstance(questions,list) or len(questions)>20:
        raise ValueError('Use no more than 20 enquiry questions.')
    seen=set()
    for q in questions:
        if not isinstance(q,dict):raise ValueError('Invalid enquiry question.')
        key=q.get('id');label=q.get('label')
        if not isinstance(key,str) or not key or len(key)>80 or key in seen:
            raise ValueError('Every enquiry question needs a unique identifier.')
        seen.add(key)
        if not isinstance(label,str) or not label.strip() or len(label)>240:
            raise ValueError('Give every enquiry question a label of 1–240 characters.')
        if q.get('type') not in ('text','textarea','select'):
            raise ValueError('Choose text, textarea or select for each enquiry question.')
        if not isinstance(q.get('required',False),bool):raise ValueError('Required must be a checkbox value.')
        if q.get('type')=='select':
            options=q.get('options',[])
            if not isinstance(options,list) or not 1<=len(options)<=50 or any(not isinstance(o,str) or not o.strip() or len(o)>240 for o in options):
                raise ValueError('Dropdown questions need 1–50 non-empty options.')
    return questions
