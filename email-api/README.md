# Minimal Email API (Node.js + Express)

API REST minimaliste pour envoyer des e-mails via SMTP avec validation, sécurité basique, logs et limitation de débit.

## Structure

```text
email-api/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/
    └── server.js
```

## 1) Initialisation du projet

```bash
cd email-api
npm install
cp .env.example .env
```

Ensuite, adaptez les valeurs SMTP dans `.env` (ne jamais commiter vos secrets).

## 2) Variables d'environnement (`.env`)

Exemple (valeurs factices):

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.fake_api_key_1234567890
SMTP_FROM="Notifications API <no-reply@example.com>"
PORT=3000
```

## 3) Lancer le serveur

```bash
npm run dev
# ou
npm start
```

## 4) Endpoint

### `POST /send-email`

**Headers requis**

- `Content-Type: application/json`

**Payload JSON**

- `to` (string, e-mail valide, obligatoire)
- `subject` (string, obligatoire)
- `body` (string, obligatoire)
- `cc` (array d'e-mails, optionnel)
- `bcc` (array d'e-mails, optionnel)

### Exemple `curl`

```bash
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinataire@example.com",
    "subject": "Test API Email",
    "body": "Ceci est un e-mail envoyé via une API REST.",
    "cc": ["copie1@example.com"],
    "bcc": ["copiecachee@example.com"]
  }'
```

### Réponse succès (exemple)

```json
{
  "status": "success",
  "message": "Email envoyé à destinataire@example.com",
  "messageId": "<...>",
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

### Réponse erreur de validation (exemple)

```json
{
  "status": "error",
  "message": "Payload invalide.",
  "details": [
    "to: Invalid email"
  ]
}
```

## Sécurité et robustesse incluses

- Validation stricte avec **Zod**.
- Limitation à **10 requêtes/minute** sur `/send-email`.
- Credentials SMTP lus via variables d'environnement.
- Logging HTTP avec **morgan**.
- Gestion des erreurs SMTP avec réponses JSON explicites.
