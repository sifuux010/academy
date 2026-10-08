"""
Reprise des points clés et des références dans leurs tables.

Les deux vivaient dans des colonnes JSON de chaînes. Les laisser là
aurait condamné l'administration à éditer du JSON à la main ; les
déplacer libère aussi la mise en forme, qui distingue désormais la
citation de sa revue.

La migration est réversible : le retour réécrit les listes de chaînes.
"""

from django.db import migrations

# Une référence est généralement « Auteurs (année). Titre. » suivie de la
# revue. On coupe sur le dernier point qui précède la revue, et à défaut
# on garde tout dans la citation — mieux vaut une référence intacte mais
# non découpée qu'une référence tronquée.
def split_reference(raw: str) -> tuple[str, str]:
    text = (raw or "").strip()
    if not text:
        return "", ""
    marker = ". "
    # On cherche la coupure après le titre : le dernier « . » suivi d'une
    # majuscule ou d'un chiffre, qui ouvre le nom de la revue.
    best = -1
    start = 0
    while True:
        at = text.find(marker, start)
        if at == -1:
            break
        tail = text[at + 2:]
        if tail[:1].isupper() or tail[:1].isdigit():
            best = at
        start = at + 1
    if best == -1:
        return text, ""
    return text[: best + 1].strip(), text[best + 2:].strip()


def forwards(apps, schema_editor):
    Resource = apps.get_model("content", "Resource")
    KeyPoint = apps.get_model("content", "ResourceKeyPoint")
    Reference = apps.get_model("content", "ResourceReference")

    points, refs = [], []
    for resource in Resource.objects.all().iterator():
        for index, raw in enumerate(resource.key_points or []):
            label = str(raw).strip()
            if not label:
                continue
            # Une chaîne seule devient le titre ; le texte reste vide et
            # l'équipe éditoriale le complète depuis l'administration.
            points.append(
                KeyPoint(resource_id=resource.id, title=label[:200], text="",
                         icon="check", position=index)
            )
        for index, raw in enumerate(resource.references or []):
            citation, source = split_reference(str(raw))
            if not citation:
                continue
            refs.append(
                Reference(resource_id=resource.id, citation=citation[:400],
                          source=source[:300], position=index)
            )

    KeyPoint.objects.bulk_create(points, batch_size=500)
    Reference.objects.bulk_create(refs, batch_size=500)


def backwards(apps, schema_editor):
    Resource = apps.get_model("content", "Resource")
    KeyPoint = apps.get_model("content", "ResourceKeyPoint")
    Reference = apps.get_model("content", "ResourceReference")

    for resource in Resource.objects.all().iterator():
        resource.key_points = [
            point.title
            for point in KeyPoint.objects.filter(resource_id=resource.id).order_by("position")
        ]
        resource.references = [
            " ".join(filter(None, [reference.citation, reference.source]))
            for reference in Reference.objects.filter(resource_id=resource.id).order_by("position")
        ]
        resource.save(update_fields=["key_points", "references"])


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_resourcekeypoint_resourcereference"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
