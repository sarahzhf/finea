import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ReceiptData {
  merchant?: string;
  date?: string;
  total?: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity?: string;
    price?: string;
  }>;
  rawText: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    // Vérifier la clé API OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Configuration manquante',
          details: 'OPENAI_API_KEY non configurée dans .env.local'
        },
        { status: 500 }
      );
    }

    // Convertir l'image en base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

    console.log('📄 Envoi de l\'image à ChatGPT Vision...');

    // Initialiser OpenAI
    const openai = new OpenAI({ apiKey });

    // Appel à ChatGPT Vision avec instructions précises
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Plus rapide et moins cher que gpt-4o
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse ce ticket de caisse et extrait les informations suivantes au format JSON :
              
{
  "merchant": "nom du commerçant",
  "date": "date au format JJ/MM/AAAA",
  "total": "montant total (juste le nombre, sans le symbole €)",
  "currency": "EUR",
  "items": [
    {
      "description": "nom de l'article",
      "quantity": "quantité (si visible)",
      "price": "prix unitaire (si visible)"
    }
  ]
}

Instructions importantes :
- Si une information n'est pas visible, mets null
- Pour le total, extrait uniquement le nombre (par exemple "45.50" et pas "45.50 €")
- Pour les items, liste tous les articles visibles sur le ticket
- Sois précis et extrais exactement ce qui est écrit
- Réponds UNIQUEMENT avec le JSON, sans autre texte

Voici l'image du ticket :`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high" // Haute résolution pour mieux lire
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Plus bas = plus précis et déterministe
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Pas de réponse de ChatGPT');
    }

    console.log('✅ Réponse reçue de ChatGPT');
    console.log('Contenu brut:', content);

    // Parser la réponse JSON
    let receiptData: ReceiptData;
    
    try {
      // Nettoyer le contenu (enlever les ```json si présents)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanContent);
      
      receiptData = {
        merchant: parsed.merchant || undefined,
        date: parsed.date || undefined,
        total: parsed.total || undefined,
        currency: parsed.currency || 'EUR',
        items: parsed.items || [],
        rawText: content,
      };
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError);
      // Si le parsing échoue, on retourne quand même le texte brut
      receiptData = {
        items: [],
        rawText: content,
      };
    }

    console.log('📊 Données extraites:', {
      merchant: receiptData.merchant,
      total: receiptData.total,
      itemsCount: receiptData.items.length,
    });

    return NextResponse.json({
      success: true,
      data: receiptData,
    });

  } catch (error: any) {
    console.error('❌ Erreur OCR:', error);
    
    // Gestion d'erreurs spécifiques OpenAI
    if (error.status === 401) {
      return NextResponse.json(
        { 
          error: 'Clé API OpenAI invalide',
          details: 'Vérifiez OPENAI_API_KEY dans .env.local'
        },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Limite de requêtes atteinte',
          details: 'Attendez quelques instants et réessayez'
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement de l\'image',
        details: error.message 
      },
      { status: 500 }
    );
  }
}