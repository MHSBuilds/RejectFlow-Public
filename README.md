# RejectFlow 🚀

Streamline your recruitment rejection workflow with AI-powered, personalized rejection emails.

## What is RejectFlow?

RejectFlow automates the rejection email process by:
1. **Upload candidates** - CSV or manual entry
2. **Collect feedback** - Capture interview insights
3. **Generate drafts** - AI creates personalized rejection emails
4. **Review & approve** - Edit and refine before sending
5. **Send emails** - One-click distribution via Resend

## Features

- ✨ **AI-Powered Email Generation** - Anthropic's advanced AI models create empathetic, personalized rejection emails
- 📧 **Smart Personalization** - Emails adapted to candidate's role, experience level, and feedback
- ⚡ **Fast Workflow** - From candidate data to approved email in minutes
- 🔒 **Enterprise Security** - NextAuth authentication, encrypted data, compliance-ready
- 🌐 **Multi-Region Support** - Global pricing with regional multipliers
- 📊 **Bulk Processing** - Handle dozens of candidates per request
- 🔗 **ATS Integration** - Connect with Workday, Bamboo HR, Greenhouse
- 📱 **Web App & API** - Use the interface or integrate via REST API

## Pricing

| Plan | Monthly | Annual (20% Off) | Best For |
|------|---------|------------------|----------|
| **Free** | $0 | - | Testing the platform |
| **Starter** | $49 | $39.20/mo | Small teams (2,500 emails/month) |
| **Professional** | $149 | $119.20/mo | Growing teams (10,000 emails/month) |
| **Enterprise** | Custom | Custom | Large organizations + white-label |

*All plans include 14-day free trial. Pricing adjusts by region.*

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- Resend account for email delivery

### Installation

```bash
# Clone repository
git clone https://github.com/MHSBuilds/RejectFlow-Public.git
cd RejectFlow-Public

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Visit `http://localhost:3000` and sign up with Google or email.

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic's Claude models via OpenRouter
- **Email**: Resend for reliable email delivery
- **Styling**: Tailwind CSS

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable React components
├── lib/                    # Utilities (auth, API clients, email processing)
├── types/                  # TypeScript interfaces
└── styles/                 # Global CSS
```

## Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key

# Email Service
RESEND_API_KEY=your-key

# Authentication
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
NEXTAUTH_SECRET=generate-random-string

# AI Service
OPENROUTER_API_KEY=your-key
```

See `.env.local.example` for complete list.

## Key Features Explained

### 📧 AI-Powered Email Generation

RejectFlow uses Anthropic's advanced AI to generate rejection emails that are:
- **Empathetic** - Respectful tone acknowledges candidate effort
- **Personalized** - Tailored to role, experience, and feedback
- **Professional** - Maintains brand voice and company tone
- **Constructive** - Includes development areas for senior roles

### 🔄 Draft Workflow

1. **Generate** - AI creates initial draft based on candidate data
2. **Review** - Human approval + optional edits
3. **Approve** - Lock in final version
4. **Send** - Deliver via Resend with tracking

### 🌍 Multi-Region Support

Global pricing with automatic regional adjustments for India, Pakistan, Malaysia, UAE, Saudi Arabia, Turkey, and Europe.

## File Upload Format

```csv
full_name,email,position,rating,notes,rejection_reasons,areas_for_improvement
John Doe,john@example.com,Software Engineer,6,Good technical skills but lacks experience,Insufficient experience,Technical depth
Jane Smith,jane@example.com,Product Manager,4,Strong communication but limited experience,Limited PM experience,Product strategy
```

## Development

### Run Locally

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint + Next.js checks
```

### Database Migrations

Schema defined in `supabase-schema.sql`. Apply via Supabase SQL Editor.

### Docker Support

```bash
docker-compose up --build
```

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub main branch
git push origin main

# Vercel auto-deploys with webhook
```

Set environment variables in Vercel Dashboard → Settings → Environment Variables.

## Security & Privacy

- 🔐 **End-to-end encryption** for candidate data
- ✅ **GDPR compliant** data handling
- 🔑 **Secure authentication** via NextAuth.js
- 📋 **Role-based access** control for teams
- 🛡️ **Regular security audits**

## API Reference

### Authentication
All API endpoints require NextAuth session authentication.

#### Generate Rejection Email
```bash
POST /api/drafts/generate
Content-Type: application/json

{
  "candidateId": "uuid-here",
  "feedbackId": "uuid-here"
}
```

Response:
```json
{
  "success": true,
  "draftId": "uuid",
  "content": "Dear [Candidate]...",
  "status": "draft"
}
```

See full API Documentation under the API Docs page for complete reference. This page can be found once signed in to the application.

## Troubleshooting

### Email Formatting Issues
- Emails are tested for consistency across Gmail and Outlook
- If formatting appears broken, check your email client settings
- Try viewing in a different email client to verify

### Build Errors
```bash
# Clear build cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check that your IP is in Supabase firewall whitelist
- Test connection via Supabase dashboard

## Roadmap for Paid Customers

- [ ] Webhook integrations for ATS systems
- [ ] Advanced email template customization
- [ ] Analytics dashboard with performance metrics
- [ ] Team collaboration & approval workflows
- [ ] Additional language support

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Email delivery by [Resend](https://resend.com/)
- Database by [Supabase](https://supabase.io/)
- AI powered by [Anthropic](https://anthropic.com/)

---

**Made with ❤️ by the RejectFlow team**

