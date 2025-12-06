/**
 * Routes pour la gestion des invitations portail
 */
import { Router, Request, Response } from 'express';
import PortalInvitation from '../models/PortalInvitation';
import PortalInvitationService from '../services/portal-invitation-service';

const router = Router();

// GET /invitations/:token - Récupérer une invitation par token (pour la page d'acceptation)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const invitation = await PortalInvitation.findOne({ token: req.params.token });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({ error: 'Cette invitation a déjà été acceptée' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Cette invitation a expiré' });
    }

    // Retourner les informations de l'invitation (sans le token sensible)
    res.json({
      invitationId: invitation.invitationId,
      orderId: invitation.orderId,
      email: invitation.email,
      contactName: invitation.contactName,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: "Erreur lors de la récupération de l'invitation" });
  }
});

// POST /invitations/accept - Accepter une invitation
router.post('/accept', async (req: Request, res: Response) => {
  try {
    const { token, userId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token requis' });
    }

    // userId peut être créé automatiquement si l'utilisateur n'existe pas encore
    const result = await PortalInvitationService.acceptInvitation(token, userId || 'auto');

    res.json({
      success: true,
      ...result,
      message: 'Invitation acceptée avec succès'
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({ error: error.message || "Erreur lors de l'acceptation de l'invitation" });
  }
});

// GET /invitations/order/:orderId - Récupérer les invitations d'une commande
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const invitations = await PortalInvitationService.getOrderInvitations(req.params.orderId);
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching order invitations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des invitations' });
  }
});

// POST /invitations/:invitationId/resend - Renvoyer une invitation
router.post('/:invitationId/resend', async (req: Request, res: Response) => {
  try {
    await PortalInvitationService.resendInvitation(req.params.invitationId);
    res.json({ success: true, message: 'Invitation renvoyée avec succès' });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    res.status(400).json({ error: error.message || "Erreur lors du renvoi de l'invitation" });
  }
});

export default router;
