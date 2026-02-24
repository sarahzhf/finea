import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

def main():
    service_account_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")
    service_account_path = os.path.abspath(service_account_path)

    if not os.path.exists(service_account_path):
        print("ERROR: serviceAccountKey.json introuvable:", service_account_path)
        sys.exit(1)

    cred = credentials.Certificate(service_account_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client()

    # IMPORTANT: remplace par le nom de ta collection trouvé via le script 1
    COLLECTION_NAME = "quiz_sessions"  # <-- à adapter

    print(f"Lecture de la collection: {COLLECTION_NAME}")

    docs = list(db.collection(COLLECTION_NAME).limit(20).stream())
    print("Nombre de documents lus (max 20):", len(docs))

    if not docs:
        print("=> 0 document. Vérifie le nom de la collection et si elle contient des données.")
        return

    all_tags = set()

    for i, doc in enumerate(docs, start=1):
        data = doc.to_dict()
        q = data.get("question")
        tags_raw = data.get("tags", "")
        active = data.get("active", data.get("isActive", None))  # au cas où

        print("\n--- Doc", i, "ID:", doc.id, "---")
        print("question:", (q[:80] + "…") if isinstance(q, str) and len(q) > 80 else q)
        print("active/isActive:", active)
        print("tags raw:", tags_raw)

        if isinstance(tags_raw, str):
            for t in tags_raw.split(";"):
                t = t.strip().lower()
                if t:
                    all_tags.add(t)

    print("\nTags uniques trouvés (dans ces 20 docs):")
    for t in sorted(all_tags):
        print(" -", t)

if __name__ == "__main__":
    main()