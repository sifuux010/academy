"""Sur un hébergement sans en-têtes MySQL (cPanel mutualisé), `mysqlclient`
ne compile pas. PyMySQL le remplace en pur Python : ce shim l'enregistre
sous le nom `MySQLdb` attendu par Django, avant toute connexion à la base.
Sans effet si PyMySQL n'est pas installé (dev local sous mysqlclient)."""

try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ModuleNotFoundError:
    pass
