import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany();
    if (alerts.length === 0) return NextResponse.json({ message: 'Aucune alerte' });

    const symbols = [...new Set(alerts.map(a => a.symbol))].join(',');
    
    const response = await axios.get(`${process.env.CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
      params: { symbol: symbols }
    });

    const prices = response.data.data;
    let alertsTriggered = 0;

    for (const alert of alerts) {
      const currentPrice = prices[alert.symbol].quote.USD.price;
      let shouldTrigger = false;

      // --- NOUVELLE LOGIQUE ---
      if (alert.direction === 'UP' && currentPrice >= alert.target) {
        shouldTrigger = true; // Ça a dépassé le plafond
      } else if (alert.direction === 'DOWN' && currentPrice <= alert.target) {
        shouldTrigger = true; // C'est passé sous le plancher
      }
      // ------------------------

      if (shouldTrigger) {
        await transporter.sendMail({
          from: `"Crypto Bot" <${process.env.SMTP_USER}>`,
          to: alert.email,
          subject: `🚨 ALERTE ${alert.direction === 'UP' ? 'HAUSSE' : 'BAISSE'} : ${alert.symbol}`,
          html: `
            <h1>Objectif Atteint !</h1>
            <p>Le <strong>${alert.symbol}</strong> est à <strong>$${currentPrice.toFixed(2)}</strong>.</p>
            <p>Ton alerte était fixée à : $${alert.target} (${alert.direction === 'UP' ? 'si ça dépasse' : 'si ça descend en dessous'})</p>
          `
        });

        await prisma.alert.delete({ where: { id: alert.id } });
        alertsTriggered++;
      }
    }

    return NextResponse.json({ alertsChecked: alerts.length, alertsTriggered });

  } catch (error) {
    console.error("Erreur CRON:", error);
    return NextResponse.json({ error: 'Erreur vérification' }, { status: 500 });
  }
}