/**
 * Script de test pour l'envoi d'email via SMTP OVH
 * Usage: npx ts-node test-email.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { EmailService } from './src/services/email-service';

async function testEmail() {
  console.log('=== Test Email SMTP OVH ===\n');

  console.log('Configuration:');
  console.log(`  SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`  SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`  SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***' : 'NON DEFINI'}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log('');

  const emailService = new EmailService();

  console.log(`Provider actif: ${emailService.getProvider()}`);
  console.log('');

  // Test d'envoi d'invitation
  const testEmail = process.argv[2] || 'test@example.com';

  console.log(`Envoi d'un email de test à: ${testEmail}`);
  console.log('');

  try {
    const result = await emailService.sendLogisticianInvitation({
      email: testEmail,
      industrialName: 'Test Industriel',
      companyName: 'Ma Société Test',
      invitationUrl: 'https://logistician.symphonia-controltower.com/invitation/test-token-123',
      accessLevel: 'view',
      message: 'Ceci est un email de test pour vérifier la configuration SMTP.',
    });

    if (result) {
      console.log('✅ Email envoyé avec succès!');
    } else {
      console.log('❌ Échec de l\'envoi de l\'email');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testEmail();
