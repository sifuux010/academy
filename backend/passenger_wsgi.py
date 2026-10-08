"""Point d'entrée Phusion Passenger (cPanel « Setup Python App »).

cPanel crée et active lui-même le virtualenv indiqué dans l'interface — ce
fichier n'en a pas besoin, contrairement à un déploiement manuel. Il se
contente d'exposer `application`, le nom que Passenger recherche.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
