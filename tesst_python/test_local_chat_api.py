import os
import json
import requests
from dotenv import load_dotenv

def main():
    # Charge .env.local
    load_dotenv(".env.local")

    # URL de ta route Next.js (adapte le port si besoin)
    url = os.getenv("OPENAI_API_KEY", "http://localhost:3000/api/chat")

    # Si ta route exige un header Authorization (Firebase token),
    # tu peux le mettre dans .env.local sous FIREBASE_ID_TOKEN=...
    firebase_token = os.getenv("FIREBASE_ID_TOKEN", "").strip()

    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/json",
    }
    if firebase_token:
        headers["Authorization"] = f"Bearer {firebase_token}"

    payload = {
        "messages": [
            {"role": "user", "content": "Explique-moi simplement ce qu'est la liquidité en finance, avec un exemple."}
        ]
    }

    print("POST", url)
    print("Auth header:", "YES" if "Authorization" in headers else "NO")
    print("---- Response ----")

    # stream=True pour lire les réponses streaming (SSE / chunked)
    resp = requests.post(url, headers=headers, data=json.dumps(payload), stream=True, timeout=60)

    print("Status:", resp.status_code)
    print("Content-Type:", resp.headers.get("Content-Type"))

    if resp.status_code >= 400:
        # Affiche le corps d'erreur en clair (utile pour debug)
        try:
            print(resp.text)
        except Exception:
            print("Erreur HTTP, impossible de lire le corps.")
        return

    content_type = (resp.headers.get("Content-Type") or "").lower()

    # Cas 1: réponse JSON classique
    if "application/json" in content_type:
        try:
            print(resp.json())
        except Exception:
            print(resp.text)
        return

    # Cas 2: streaming type text/event-stream (SSE)
    # Beaucoup de routes AI SDK streament des lignes "data: ..."
    for line in resp.iter_lines(decode_unicode=True):
        if not line:
            continue
        # Affiche brut pour debug
        print(line)

if __name__ == "__main__":
    main()