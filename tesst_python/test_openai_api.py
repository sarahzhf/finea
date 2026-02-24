import os
from dotenv import load_dotenv
from openai import OpenAI

def main():
    print("=== Test OpenAI API ===")

    # Charger .env.local
    load_dotenv(".env.local")

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print(" OPENAI_API_KEY introuvable")
        return

    print("Clé détectée ")

    try:
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un assistant clair."},
                {"role": "user", "content": "Explique en une phrase la liquidité en finance."}
            ],
            temperature=0.3
        )

        print("\n=== Réponse ===\n")
        print(response.choices[0].message.content)

        print("\n API fonctionne.")

    except Exception as e:
        print("\n Erreur API :")
        print(type(e).__name__, e)


if __name__ == "__main__":
    main()