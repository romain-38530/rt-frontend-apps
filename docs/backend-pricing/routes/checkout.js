/**
 * Checkout Routes avec Stripe
 *
 * Endpoints pour gérer le processus de paiement via Stripe:
 * - POST /api/checkout/create-session - Créer une session Stripe Checkout
 * - POST /api/checkout/webhook - Webhook Stripe pour confirmation de paiement
 * - GET /api/checkout/success - Page de succès après paiement
 * - GET /api/checkout/cancel - Page d'annulation
 *
 * Service: subscriptions-contracts v2.4.0
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pricingService = require('../services/pricingService');

// URL de base (à configurer selon l'environnement)
const BASE_URL = process.env.BASE_URL || 'https://rt-technologie.com';

/**
 * @route   POST /api/checkout/create-session
 * @desc    Créer une session Stripe Checkout
 * @access  Public
 * @body    {string} userId - ID de l'utilisateur
 * @body    {string} accountType - Type de compte (TRANSPORTEUR, EXPEDITEUR, etc.)
 * @body    {Object} conditions - Conditions pour le calcul de prix
 * @body    {string} promoCode - Code promotionnel (optionnel)
 * @returns {Object} Session Stripe avec URL de redirection
 *
 * @example
 * POST /api/checkout/create-session
 * {
 *   "userId": "user-123",
 *   "accountType": "TRANSPORTEUR",
 *   "conditions": { "hasFeatures": ["create_orders"] },
 *   "promoCode": "LAUNCH2025"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "sessionId": "cs_test_...",
 *   "url": "https://checkout.stripe.com/pay/cs_test_..."
 * }
 */
router.post('/create-session', async (req, res) => {
  try {
    const { userId, accountType, conditions = {}, promoCode } = req.body;

    // Validation
    if (!userId || !accountType) {
      return res.status(400).json({
        success: false,
        message: 'userId et accountType requis'
      });
    }

    // Calculer le prix final
    const priceResult = await pricingService.calculatePrice(
      accountType,
      conditions,
      promoCode
    );

    if (!priceResult) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de calculer le prix'
      });
    }

    // Vérifier si le prix est gratuit
    if (priceResult.finalPrice === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce type de compte est gratuit, pas besoin de paiement',
        redirect: `/activate-account?userId=${userId}&accountType=${accountType}`
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: priceResult.billingPeriod === 'monthly' ? 'subscription' : 'payment',

      line_items: [
        {
          price_data: {
            currency: priceResult.currency.toLowerCase(),
            product_data: {
              name: `RT Technologie - ${priceResult.displayName}`,
              description: `Abonnement ${priceResult.billingPeriod === 'monthly' ? 'mensuel' : 'annuel'}`,
              images: ['https://rt-technologie.com/logo.png'],
              metadata: {
                accountType: accountType,
                appliedVariant: priceResult.appliedVariant?.name || 'none',
                appliedPromo: priceResult.appliedPromo?.code || 'none'
              }
            },
            unit_amount: Math.round(priceResult.finalPrice * 100), // Stripe utilise les centimes
            recurring: priceResult.billingPeriod === 'monthly' ? {
              interval: 'month'
            } : priceResult.billingPeriod === 'yearly' ? {
              interval: 'year'
            } : undefined
          },
          quantity: 1
        }
      ],

      // Metadata pour retrouver les infos lors du webhook
      metadata: {
        userId: userId,
        accountType: accountType,
        originalPrice: priceResult.originalPrice.toString(),
        finalPrice: priceResult.finalPrice.toString(),
        appliedVariant: priceResult.appliedVariant?.name || '',
        appliedPromo: priceResult.appliedPromo?.code || '',
        conditions: JSON.stringify(conditions)
      },

      // URLs de redirection
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/checkout/cancel?userId=${userId}&accountType=${accountType}`,

      // Email du client
      customer_email: undefined, // TODO: Récupérer depuis l'utilisateur

      // Autoriser les codes promo Stripe (en plus de nos codes custom)
      allow_promotion_codes: true,

      // Billing address collection
      billing_address_collection: 'required'
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/checkout/webhook
 * @desc    Webhook Stripe pour traiter les événements de paiement
 * @access  Public (mais vérifié avec signature Stripe)
 * @returns {Object} Confirmation
 *
 * Événements gérés:
 * - checkout.session.completed - Paiement réussi
 * - customer.subscription.created - Souscription créée
 * - customer.subscription.deleted - Souscription annulée
 * - invoice.payment_failed - Paiement échoué
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Vérifier la signature Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du webhook'
    });
  }
});

/**
 * Gérer la completion d'une session de checkout
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('💳 Checkout session completed:', session.id);

  const metadata = session.metadata;
  const userId = metadata.userId;
  const accountType = metadata.accountType;

  if (!userId || !accountType) {
    console.error('Missing userId or accountType in session metadata');
    return;
  }

  // TODO: Activer le compte utilisateur dans MongoDB
  // await User.findByIdAndUpdate(userId, {
  //   accountType: accountType,
  //   subscriptionStatus: 'active',
  //   stripeCustomerId: session.customer,
  //   stripeSubscriptionId: session.subscription,
  //   activatedAt: new Date()
  // });

  // TODO: Envoyer un email de confirmation
  // await sendEmail(userEmail, 'Compte activé', emailTemplate);

  console.log(`✅ Account activated for user ${userId} with type ${accountType}`);
}

/**
 * Gérer la création d'une souscription
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', subscription.id);

  // TODO: Enregistrer les détails de la souscription
  // await Subscription.create({
  //   stripeSubscriptionId: subscription.id,
  //   stripeCustomerId: subscription.customer,
  //   status: subscription.status,
  //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  // });
}

/**
 * Gérer la mise à jour d'une souscription
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  // TODO: Mettre à jour le statut de la souscription
  // await Subscription.findOneAndUpdate(
  //   { stripeSubscriptionId: subscription.id },
  //   { status: subscription.status }
  // );
}

/**
 * Gérer la suppression d'une souscription
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  // TODO: Désactiver le compte ou passer en mode dégradé
  // await User.findOneAndUpdate(
  //   { stripeSubscriptionId: subscription.id },
  //   { subscriptionStatus: 'cancelled' }
  // );
}

/**
 * Gérer le succès d'un paiement de facture
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);

  // TODO: Enregistrer le paiement
  // await Payment.create({
  //   stripeInvoiceId: invoice.id,
  //   amount: invoice.amount_paid / 100,
  //   currency: invoice.currency,
  //   status: 'paid'
  // });
}

/**
 * Gérer l'échec d'un paiement de facture
 */
async function handleInvoicePaymentFailed(invoice) {
  console.log('⚠️ Invoice payment failed:', invoice.id);

  // TODO: Notifier l'utilisateur et gérer l'échec de paiement
  // await sendEmail(userEmail, 'Échec de paiement', emailTemplate);
}

/**
 * @route   GET /api/checkout/success
 * @desc    Page de succès après paiement
 * @access  Public
 * @query   {string} session_id - ID de la session Stripe
 * @returns {Object} Détails de la session
 */
router.get('/success', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID requis'
      });
    }

    // Récupérer les détails de la session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      success: true,
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total / 100,
        currency: session.currency,
        metadata: session.metadata
      }
    });

  } catch (error) {
    console.error('Get success session error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la session'
    });
  }
});

module.exports = router;
