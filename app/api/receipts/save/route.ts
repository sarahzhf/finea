import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const body = await request.json();
    const { receiptData, userId } = body;

    if (!receiptData) {
      return NextResponse.json(
        { error: 'Données du ticket manquantes' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non identifié' },
        { status: 401 }
      );
    }

    // Préparer le document à sauvegarder
    const receiptDocument = {
      userId,
      merchant: receiptData.merchant || null,
      date: receiptData.date || null,
      total: receiptData.total ? parseFloat(receiptData.total) : null,
      currency: receiptData.currency || 'EUR',
      items: receiptData.items || [],
      rawText: receiptData.rawText || '',
      createdAt: serverTimestamp(),
      scannedAt: new Date().toISOString(),
    };

    console.log(' Sauvegarde du ticket dans Firebase...');

    // Sauvegarder dans Firebase
    const docRef = await addDoc(collection(db, 'receipts'), receiptDocument);

    console.log(' Ticket sauvegardé avec ID:', docRef.id);

    return NextResponse.json({
      success: true,
      receiptId: docRef.id,
      message: 'Ticket sauvegardé avec succès'
    });

  } catch (error: any) {
    console.error(' Erreur sauvegarde Firebase:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la sauvegarde',
        details: error.message 
      },
      { status: 500 }
    );
  }
}