import os
import sys
import json
import firebase_admin
from firebase_admin import credentials, firestore

def main():
    # Chemin vers le service account (même logique que ton .env.local)
    service_account_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")

    # Rendre le chemin absolu pour être sûr
    service_account_path = os.path.abspath(service_account_path)

    print("=== Firebase Firestore connection test ===")
    print("Service account path:", service_account_path)

    if not os.path.exists(service_account_path):
        print("ERROR: serviceAccountKey.json introuvable.")
        print("=> Vérifie FIREBASE_SERVICE_ACCOUNT_PATH ou place le fichier au bon endroit.")
        sys.exit(1)

    # Affiche quelques infos du JSON (sans secrets)
    with open(service_account_path, "r", encoding="utf-8") as f:
        sa = json.load(f)
    print("Service account project_id:", sa.get("project_id"))
    print("Service account client_email:", sa.get("client_email"))

    # Init Firebase Admin
    cred = credentials.Certificate(service_account_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        # App déjà initialisée (si tu relances dans un environnement interactif)
        pass

    db = firestore.client()

    # Petite requête simple : lire 1 doc d'une collection inconnue n'est pas possible,
    # donc on va lister les "collections racine"
    print("\nListing root collections...")
    collections = list(db.collections())
    if not collections:
        print("Aucune collection racine trouvée (ou projet vide).")
        print("Si tu es sûr d'avoir des données, vérifie que tu regardes le bon project_id.")
        return

    for col in collections:
        print(" -", col.id)

    print("\nOK: Firestore répond et les collections sont accessibles.")

if __name__ == "__main__":
    main()
