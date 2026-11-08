"""Generate immutable catalog seed SQL for a new migration; never rewrite an applied migration."""
import hashlib
import json
from pathlib import Path
c = json.loads(Path('data/observation-catalog.json').read_text())
def literal(value):
    return "'" + json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace("'", "''") + "'::jsonb"
lines = [f"insert into observation_catalog_versions(version,fingerprint) values ({c['version']},'{hashlib.sha256(json.dumps(c,sort_keys=True).encode()).hexdigest()}');"]
for table, items in [('domains',c['domains']),('types',list(c['types'].values())),('questions',list(c['questions'].values()))]:
    for item in items:
        lines.append(f"insert into observation_catalog_{table}(version,id,definition) values ({c['version']},'{item['id']}',{literal(item)});")
for topic in c['topics']:
    lines.append(f"insert into observation_catalog_topics(version,id,domain_id,definition) values ({c['version']},'{topic['id']}','{topic['domainId']}',{literal(topic)});")
    for type_id in topic['typeIds']:
        lines.append(f"insert into observation_catalog_routes(version,topic_id,type_id) values ({c['version']},'{topic['id']}','{type_id}');")
print('\n'.join(lines))
