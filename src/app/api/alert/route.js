import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// 1. CRÉER UNE ALERTE
export async function POST(request) {
  try {
    const body = await request.json();
    const { symbol, targetPrice, email, currentPrice } = body; // On reçoit le prix actuel

    // Logique intelligente : Déterminer la direction
    // Si Cible > Actuel => On attend que ça monte (UP)
    // Si Cible < Actuel => On attend que ça descende (DOWN)
    const direction = parseFloat(targetPrice) > currentPrice ? 'UP' : 'DOWN';

    const newAlert = await prisma.alert.create({
      data: {
        symbol,
        target: parseFloat(targetPrice),
        email,
        direction // On sauvegarde la direction
      },
    });

    return NextResponse.json(newAlert);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
}

// 2. RÉCUPÉRER LA LISTE DES ALERTES
export async function GET() {
  try {
    // On récupère les alertes triées par date (plus récentes en haut)
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur récupération' }, { status: 500 });
  }
}

// 3. SUPPRIMER UNE ALERTE
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await prisma.alert.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Supprimé' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}