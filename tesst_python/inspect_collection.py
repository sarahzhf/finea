import os
import firebase_admin
from firebase_admin import credentials, firestore

def main():
    service_account_path = os.path.abspath(os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json"))

    cred = credentials.Certificate(service_account_path)
    try:
        firebase_admin.initialize_app(cred)
    except ValueError:
        pass

    db = firestore.client()

    COLLECTION_NAME = "questions"  # <- ton cas
    print(f"Inspect collection: {COLLECTION_NAME}\n")

    docs = list(db.collection(COLLECTION_NAME).limit(5).stream())
    print("Docs read:", len(docs))
    if not docs:
        print("=> 0 doc. Collection vide ou mauvais nom.")
        return

    expected = [
        "question","choix_a","choix_b","choix_c","choix_d",
        "bonne_reponse","explication","difficulte_score","difficulte_niveau",
        "tags","version","actif"
    ]

    for d in docs:
        data = d.to_dict()
        print("\n--- DOC ID:", d.id, "---")
        keys = sorted(list(data.keys()))
        print("Keys:", keys)

        missing = [k for k in expected if k not in data]
        if missing:
            print("MISSING expected fields:", missing)
        else:
            print("All expected fields present ✅")

        # un petit aperçu
        q = data.get("question")
        print("question preview:", (q[:100] + "…") if isinstance(q, str) and len(q) > 100 else q)
        print("tags:", data.get("tags"))
        print("choices:", data.get("choices"))
        print("correctIndex:", data.get("correctIndex"))
        print("difficultyLevel:", data.get("difficultyLevel"))
        print("difficultyScore:", data.get("difficultyScore"))
        print("explanation:", data.get("explanation"))
        print("id:", data.get("id"))
        print("tags:", data.get("tags"))
        print("updatedAt:", data.get("updatedAt"))
        print("version:", data.get("version"))

if __name__ == "__main__":
    main()