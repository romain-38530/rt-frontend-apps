#!/usr/bin/env python3
"""
Script pour configurer les DNS OVH pour la reception d'emails SES
Ajoute les enregistrements MX et TXT necessaires pour inbound.symphonia-controltower.com
"""

import ovh
import sys
import os

# Configuration - A remplacer par tes credentials OVH
# Tu peux les generer sur: https://eu.api.ovh.com/createToken/
# Droits requis: GET/POST/PUT /domain/zone/*

OVH_ENDPOINT = 'ovh-eu'  # ou 'ovh-ca', 'kimsufi-eu', etc.
OVH_APPLICATION_KEY = os.environ.get('OVH_APPLICATION_KEY', '')
OVH_APPLICATION_SECRET = os.environ.get('OVH_APPLICATION_SECRET', '')
OVH_CONSUMER_KEY = os.environ.get('OVH_CONSUMER_KEY', '')

DOMAIN = 'symphonia-controltower.com'

# Enregistrements a ajouter
DNS_RECORDS = [
    {
        'fieldType': 'TXT',
        'subDomain': '_amazonses.inbound',
        'target': '"11MN68uxNTyJYno5yH9gDlOrwY7u9Mlo1aHHEQqdyhM="',
        'ttl': 3600
    },
    {
        'fieldType': 'MX',
        'subDomain': 'inbound',
        'target': '10 inbound-smtp.eu-central-1.amazonaws.com.',
        'ttl': 3600
    }
]

def main():
    if not all([OVH_APPLICATION_KEY, OVH_APPLICATION_SECRET, OVH_CONSUMER_KEY]):
        print("=" * 60)
        print("CONFIGURATION OVH API REQUISE")
        print("=" * 60)
        print()
        print("1. Va sur: https://eu.api.ovh.com/createToken/")
        print()
        print("2. Remplis le formulaire:")
        print("   - Validity: Unlimited")
        print("   - Rights:")
        print("     GET    /domain/zone/*")
        print("     POST   /domain/zone/*")
        print("     PUT    /domain/zone/*")
        print()
        print("3. Execute avec les variables d'environnement:")
        print()
        print("   set OVH_APPLICATION_KEY=ton_app_key")
        print("   set OVH_APPLICATION_SECRET=ton_app_secret")
        print("   set OVH_CONSUMER_KEY=ton_consumer_key")
        print("   python configure-ovh-dns.py")
        print()
        print("=" * 60)
        return 1

    try:
        client = ovh.Client(
            endpoint=OVH_ENDPOINT,
            application_key=OVH_APPLICATION_KEY,
            application_secret=OVH_APPLICATION_SECRET,
            consumer_key=OVH_CONSUMER_KEY
        )

        print(f"Connexion a OVH API reussie")
        print(f"Configuration DNS pour: {DOMAIN}")
        print()

        # Verifier que le domaine existe
        zones = client.get('/domain/zone')
        if DOMAIN not in zones:
            print(f"ERREUR: Le domaine {DOMAIN} n'est pas trouve dans ton compte OVH")
            print(f"Domaines disponibles: {zones}")
            return 1

        # Ajouter les enregistrements
        for record in DNS_RECORDS:
            print(f"Ajout: {record['subDomain']}.{DOMAIN} {record['fieldType']} {record['target']}")

            try:
                result = client.post(f'/domain/zone/{DOMAIN}/record',
                    fieldType=record['fieldType'],
                    subDomain=record['subDomain'],
                    target=record['target'],
                    ttl=record['ttl']
                )
                print(f"  -> OK (ID: {result['id']})")
            except ovh.exceptions.ResourceConflictError:
                print(f"  -> Deja existant, ignoré")
            except Exception as e:
                print(f"  -> ERREUR: {e}")

        # Rafraichir la zone
        print()
        print("Rafraichissement de la zone DNS...")
        client.post(f'/domain/zone/{DOMAIN}/refresh')
        print("Zone rafraichie!")

        print()
        print("=" * 60)
        print("CONFIGURATION TERMINEE")
        print("=" * 60)
        print()
        print("Les enregistrements DNS ont ete ajoutes.")
        print("Propagation DNS: 5-30 minutes")
        print()
        print("Pour verifier:")
        print(f"  nslookup -type=MX inbound.{DOMAIN}")
        print(f"  nslookup -type=TXT _amazonses.inbound.{DOMAIN}")
        print()

        return 0

    except ovh.exceptions.InvalidCredential as e:
        print(f"ERREUR: Credentials OVH invalides: {e}")
        return 1
    except Exception as e:
        print(f"ERREUR: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
